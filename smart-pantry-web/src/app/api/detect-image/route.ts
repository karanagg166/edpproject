import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CohereClientV2 } from "cohere-ai";
import { getAuthUser } from "@/lib/auth-guard";
import { categorizeItem } from "@/lib/categorizer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { imageBase64, quantities } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Ensure the image string starts with data:image/jpeg;base64, or similar
    // Cohere expects the data URI format
    let dataUri = imageBase64;
    if (!dataUri.startsWith("data:")) {
      dataUri = `data:image/jpeg;base64,${imageBase64}`;
    }

    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const systemPrompt = `Analyze this image and identify all food items visible. For each item, return a JSON array with:
- "name": common name of the food item (lowercase)
- "category": one of [fruits, vegetables, dairy, meat_poultry, grains, snacks, beverages, other]
- "confidence": your confidence from 0.0 to 1.0
- "estimated_count": how many individual units of this item are visible (e.g., 3 bananas = 3, 1 milk carton = 1)

Return ONLY a valid JSON array, no other text or markdown formatting. Example:
[{"name": "banana", "category": "fruits", "confidence": 0.95, "estimated_count": 3}]
If no food items are visible, return an empty array: []`;

    const response = await cohere.chat({
      model: "command-a-vision-07-2025",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { type: "image_url", imageUrl: { url: dataUri } }
          ]
        }
      ] as any, // Cohere SDK typings might not be fully up-to-date with Vision inputs yet in the V2 client, cast to any if needed
      temperature: 0.1,
    });

    const responseText = (response.message?.content?.[0] as any)?.text || "";
    
    // Parse the JSON response
    let detectedItems: Array<{name: string, category: string, confidence: number, estimated_count?: number}> = [];
    try {
      // Find the first '[' and last ']' to extract JSON
      const startIdx = responseText.indexOf('[');
      const endIdx = responseText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = responseText.substring(startIdx, endIdx + 1);
        detectedItems = JSON.parse(jsonStr);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseErr) {
      console.error("Failed to parse Cohere Vision response:", responseText);
      return NextResponse.json({ error: "Failed to parse detection results", raw: responseText }, { status: 500 });
    }

    if (!Array.isArray(detectedItems) || detectedItems.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const insertions = detectedItems.map((item) => ({
      user_id: userId,
      item_name: item.name,
      category: categorizeItem(item.name) || item.category,
      confidence: item.confidence,
      // Use user-overridden quantity if provided, else AI estimate, else 1
      quantity: (quantities && quantities[item.name] != null)
        ? quantities[item.name]
        : (item.estimated_count ?? 1),
      detection_type: "vision",
      status: "pending",
      action: "detected",
    }));

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("detection_history")
      .insert(insertions)
      .select();

    if (insertError) {
      console.error("Error inserting detections:", insertError);
      return NextResponse.json({ error: "Failed to record detections" }, { status: 500 });
    }

    return NextResponse.json({ items: insertedData });
  } catch (err) {
    console.error("Detect Image API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
