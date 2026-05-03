import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import { CohereClientV2 } from "cohere-ai";

// Approximate shelf life mapped by category in days
// Used as a fallback if OCR fails to find a date
const CATEGORY_SHELF_LIFE: Record<string, number> = {
  dairy: 7,
  beverages: 180,
  snacks: 90,
  grains: 365,
  condiments: 365,
  produce: 7,
  meat: 3,
  frozen: 180,
  other: 30,
};

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageBase64, category, estimateOnly } = await req.json();
    
    if (estimateOnly) {
      const fallbackDays = category && CATEGORY_SHELF_LIFE[category] ? CATEGORY_SHELF_LIFE[category] : 30;
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + fallbackDays);
      return NextResponse.json({
        expiry_date: fallbackDate.toISOString().split('T')[0],
        raw_text: `AI Estimated based on category: ${category || 'Unknown'}`,
        confidence: 0.8
      });
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    let dataUri = imageBase64;
    if (!dataUri.startsWith("data:")) {
      dataUri = `data:image/jpeg;base64,\${imageBase64}`;
    }

    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const systemPrompt = `Look at this product expiry date image. Read the text and identify the expiry date.
If you find a date, return it in YYYY-MM-DD format. If it's a relative date like "Use by Oct 2026", convert it to the last day of the month (e.g., 2026-10-31).

CRITICAL RULES:
1. DO NOT return dates labeled as "MFG", "PKD", "Manufactured", or "Packed". These are NOT expiry dates.
2. Only look for dates labeled "EXP", "Use By", "Best Before", or dates that are clearly meant to be the expiration date.

Return a JSON object with:
- "expiry_date": extracted date in YYYY-MM-DD format, or null if you absolutely cannot read any date.
- "raw_text": the exact text you read that indicates the expiry.
- "confidence": your confidence from 0.0 to 1.0.

Return ONLY a valid JSON object, no other text or markdown formatting. Example:
{"expiry_date": "2026-10-31", "raw_text": "USE BY OCT 2026", "confidence": 0.95}`;

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
      ] as any,
      temperature: 0.1,
    });

    const responseText = (response.message?.content?.[0] as any)?.text || "";
    
    let result: { expiry_date: string | null, raw_text: string, confidence: number } = {
      expiry_date: null,
      raw_text: "",
      confidence: 0
    };

    try {
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = responseText.substring(startIdx, endIdx + 1);
        result = JSON.parse(jsonStr);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseErr) {
      console.error("Failed to parse Cohere Vision expiry response:", responseText);
      // We will fallback if parse fails
    }

    // Apply category fallback if no valid date found
    if (!result.expiry_date && category && CATEGORY_SHELF_LIFE[category]) {
      const fallbackDays = CATEGORY_SHELF_LIFE[category];
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + fallbackDays);
      result.expiry_date = fallbackDate.toISOString().split('T')[0];
      result.raw_text = `Fallback based on category: \${category} (\${fallbackDays} days)`;
      result.confidence = 0.5;
    } else if (!result.expiry_date) {
      // General fallback if no category
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 30);
      result.expiry_date = fallbackDate.toISOString().split('T')[0];
      result.raw_text = `Default fallback (30 days)`;
      result.confidence = 0.1;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Detect Expiry API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
