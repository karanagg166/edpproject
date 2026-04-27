import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { getAuthUser } from "@/lib/auth-guard";

export async function POST(req: Request) {
  try {
    const { currentWeight, targetWeight, timelineWeeks, goal, userId: fallbackUserId } = await req.json();

    let userId;
    const user = await getAuthUser();
    if (user) {
      userId = user.id;
    } else if (fallbackUserId) {
      userId = fallbackUserId; // Fallback to client-side userId
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pantry } = await sb
      .from("pantry")
      .select("name, quantity, category, expiry_date, calories_per_100g, protein_per_100g")
      .or(`user_id.eq.${userId},user_id.eq.user_1`);

    const weightDiff = (targetWeight || currentWeight) - (currentWeight || 70);
    const autoGoal = goal || (weightDiff < -2 ? "Weight Loss" : weightDiff > 2 ? "Muscle Gain" : "Maintenance");
    const weeklyTarget = weightDiff !== 0 && timelineWeeks
      ? `${Math.abs(weightDiff / timelineWeeks).toFixed(1)}kg per week`
      : "maintenance calories";

    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const prompt = `You are a professional nutritionist creating a personalized diet plan.

User profile:
- Goal: ${autoGoal}
- Current weight: ${currentWeight || "unknown"}kg
- Target weight: ${targetWeight || "unknown"}kg  
- Timeline: ${timelineWeeks || "?"} weeks (${weeklyTarget})

Available pantry items: ${JSON.stringify(pantry?.map(p => ({ name: p.name, qty: p.quantity, cat: p.category, calories: p.calories_per_100g, protein: p.protein_per_100g })) || [])}

You must return a raw JSON object with this exact structure (no markdown wrapper, just JSON):
{
  "summary": "Short encouraging summary",
  "daily_target_calories": 2000,
  "daily_target_protein": 150,
  "days": [
    {
      "day": "Day 1",
      "meals": [
        { "type": "Breakfast", "name": "...", "calories": 400, "protein": 30 },
        { "type": "Lunch", "name": "...", "calories": 600, "protein": 40 },
        { "type": "Dinner", "name": "...", "calories": 500, "protein": 40 },
        { "type": "Snack", "name": "...", "calories": 200, "protein": 10 }
      ]
    }
    // exactly 7 days
  ],
  "pantry_focus": ["item1", "item2"],
  "shopping_list": ["item1", "item2"],
  "avoid": ["item1"]
}`;

    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });
    
    const responseText = (response.message?.content?.[0] as any)?.text || "";
    
    // Robust JSON extraction
    let planObj;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      planObj = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse JSON from Cohere:", responseText);
      return NextResponse.json({ error: "Received invalid data from AI" }, { status: 500 });
    }

    // Save plan to database
    const { data: saved } = await sb.from("diet_plans").insert({
      user_id: userId,
      current_weight: currentWeight,
      target_weight: targetWeight,
      timeline_weeks: timelineWeeks,
      goal: autoGoal,
      plan_content: JSON.stringify(planObj), // save stringified JSON
      pantry_snapshot: pantry || [],
    }).select("id").single();

    return NextResponse.json({
      diet: planObj,
      planId: saved?.id,
      goal: autoGoal,
    });
  } catch (err) {
    console.error("Diet API error:", err);
    return NextResponse.json({ error: "Failed to generate diet plan" }, { status: 500 });
  }
}
