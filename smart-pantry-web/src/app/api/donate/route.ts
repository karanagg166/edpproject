import { NextRequest, NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";
import { getNGOsNear } from "@/lib/ngo-database";

// GET /api/donate?lat=X&lng=Y&radius=Z
// Returns NGOs from our curated static database, sorted by proximity
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "25");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const results = getNGOsNear(lat, lng, radius);
  return NextResponse.json({ results });
}

// Legacy POST — AI-based lookup (kept for backward compatibility)
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
      model: "command-a-03-2025",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const responseText = (response.message?.content?.[0] as { text: string })?.text || "";
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    let charities = [];
    try {
      charities = JSON.parse(cleanJson);
    } catch {
      charities = [{ name: "Database Error", address: "Please try a different city", needed: [] }];
    }

    return NextResponse.json({ charities });
  } catch (error) {
    console.error("Donate AI API Error:", error);
    return NextResponse.json({ error: "Failed to locate charities via AI" }, { status: 500 });
  }
}
