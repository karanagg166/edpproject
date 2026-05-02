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

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Ensure the image string starts with data:image/jpeg;base64, or similar
    // Cohere expects the data URI format
    let dataUri = imageBase64;
    if (!dataUri.startsWith("data:")) {
      dataUri = `data:image/jpeg;base64,\${imageBase64}`;
    }

    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const systemPrompt = `Look at this product image. Identify all the products shown in the image.
Return a JSON array of objects with:
- "name": full product name as printed on packaging (e.g., 'Amul Calci+ Milk 250ml')
- "category": one of [dairy, beverages, snacks, grains, condiments, other]
- "confidence": your confidence from 0.0 to 1.0

Return ONLY a valid JSON array of objects, no other text or markdown formatting. Example:
[{"name": "Amul Calci+ Milk 250ml", "category": "dairy", "confidence": 0.95}]`;

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
      ] as any, // Cohere SDK typings might not be fully up-to-date with Vision inputs yet in the V2 client
      temperature: 0.1,
    });

    const responseText = (response.message?.content?.[0] as any)?.text || "";
    
    // Parse the JSON response
    let detectedItems: {name: string, category: string, confidence: number}[] = [];
    try {
      // Find the first '[' and last ']' to extract JSON array
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

    if (!detectedItems || !Array.isArray(detectedItems) || detectedItems.length === 0) {
      return NextResponse.json({ error: "No products detected" }, { status: 400 });
    }

    const insertions = detectedItems.map(item => ({
      user_id: userId,
      item_name: item.name,
      category: categorizeItem(item.name) || item.category,
      confidence: item.confidence,
      quantity: 1,
      detection_type: "product_scan",
      status: "pending",
      action: "detected",
    }));

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("detection_history")
      .insert(insertions)
      .select();

    if (insertError) {
      console.error("Error inserting detection:", insertError);
      return NextResponse.json({ error: "Failed to record detection" }, { status: 500 });
    }

    return NextResponse.json({ items: insertedData });
  } catch (err) {
    console.error("Scan Product API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
