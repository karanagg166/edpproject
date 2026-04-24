import { NextResponse } from 'next/server';
import { CohereClientV2 } from 'cohere-ai';

export async function POST(req: Request) {
  try {
    const { location } = await req.json();
    
    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const cohere = new CohereClientV2({
      token: process.env.COHERE_API_KEY || "",
    });

    const prompt = `You are a helpful geolocation AI assistant. I need to find real food banks or homeless shelters in or near this location: "${location}".
Return 3 real, specific food banks or charities in that area. 

Return ONLY a valid JSON array of objects strictly matching this internal structure (NO markdown blocks, NO backticks, just raw JSON array starting with '[' and ending with ']' ):
[
  {
    "name": "Exact Name of Food Bank",
    "address": "City, ZIP, or approximate street",
    "needed": ["Canned food", "Rice"]
  }
]`;

    const response = await cohere.chat({
      model: 'command-a-03-2025',
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // low temp for accurate JSON
    });

    const responseText = (response.message?.content?.[0] as any)?.text || "";
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    // Sometimes it might not parse perfectly, add a fallback array check
    let charities = [];
    try {
      charities = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parse Error for Donate AI", cleanJson);
      charities = [{ name: "Database Error", address: "Please try a different city", needed: [] }];
    }

    return NextResponse.json({ charities });
  } catch (error) {
    console.error("Donate AI API Error:", error);
    return NextResponse.json({ error: "Failed to locate charities via AI" }, { status: 500 });
  }
}
