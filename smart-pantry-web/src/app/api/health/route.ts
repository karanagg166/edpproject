import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { getAuthUser } from "@/lib/auth-guard";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const { searchParams } = new URL(req.url);

    const { data: pantry } = await sb
      .from("pantry")
      .select("name, quantity, category, expiry_date, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g")
      .eq("user_id", userId);

    if (!pantry || pantry.length === 0) {
      return NextResponse.json({
        score: 0,
        protein_score: 0,
        carb_score: 0,
        fat_score: 0,
        micro_score: 0,
        feedback: "Your pantry is empty! Add some items to get a health score.",
        analysis: { sugar: "Unknown", sodium: "Unknown", fiber: "Unknown" },
      });
    }

    let tCals = 0, tPro = 0, tCarbs = 0, tFat = 0, tFib = 0;
    pantry.forEach(p => {
      const q = p.quantity || 1;
      tCals += (p.calories_per_100g || 0) * q;
      tPro += (p.protein_per_100g || 0) * q;
      tCarbs += (p.carbs_per_100g || 0) * q;
      tFat += (p.fat_per_100g || 0) * q;
      tFib += (p.fiber_per_100g || 0) * q;
    });

    const pantryTotals = {
      calories: Math.round(tCals),
      protein: Math.round(tPro),
      carbs: Math.round(tCarbs),
      fat: Math.round(tFat),
      fiber: Math.round(tFib),
      itemCount: pantry.length,
    };

    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const prompt = `You are a nutritionist analyzing a user's pantry for a health app.

Pantry items with nutrition: ${JSON.stringify(pantry)}
Total pantry nutrition: ${pantryTotals.calories} kcal, ${pantryTotals.protein}g protein, ${pantryTotals.fat}g fat, ${pantryTotals.carbs}g carbs.

Score the user's diet out of 100. Break it into 4 sub-scores (each out of 25):
- protein_score: How good their protein sources are
- carb_score: Quality of carbohydrates (whole grains vs refined)
- fat_score: Healthy fats vs unhealthy
- micro_score: Vitamins and minerals diversity

Also assess sugar, sodium, and fiber levels as exactly one of: "Low", "Optimal", or "High".

Return ONLY a raw JSON object (no markdown, no explanation):
{
  "score": 72,
  "protein_score": 18,
  "carb_score": 16,
  "fat_score": 20,
  "micro_score": 18,
  "feedback": "One specific actionable sentence about the biggest improvement they can make.",
  "analysis": { "sugar": "High", "sodium": "Optimal", "fiber": "Low" }
}`;

    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const responseText = (response.message?.content?.[0] as any)?.text || "";
    let cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleaned);

    // Save to health_scores table for history
    await sb.from("health_scores").insert({
      user_id: userId,
      score: result.score,
      protein_score: result.protein_score,
      carb_score: result.carb_score,
      fat_score: result.fat_score,
      micro_score: result.micro_score,
      feedback: result.feedback,
      analysis: result.analysis,
    });

    return NextResponse.json({ ...result, pantryTotals, items: pantry });
  } catch (err) {
    console.error("Health API error:", err);
    return NextResponse.json({ error: "Failed to generate health report" }, { status: 500 });
  }
}
