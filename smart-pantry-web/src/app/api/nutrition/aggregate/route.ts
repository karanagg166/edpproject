import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { getAuthUser } from "@/lib/auth-guard";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const { range = "7", startDate, endDate } = await req.json();

    // Date range calculation
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : (() => { const d = new Date(); d.setDate(d.getDate() - parseInt(range)); return d; })();

    // Fetch user goals
    const { data: userData } = await sb
      .from("users")
      .select("daily_calorie_goal")
      .eq("id", userId)
      .single();
    const dailyCalorieGoal = userData?.daily_calorie_goal || 2000;

    // Fetch pantry items (currently in stock)
    const { data: pantryItems } = await sb
      .from("pantry")
      .select("name, quantity, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, category")
      .eq("user_id", userId);

    // Fetch consumed items (removed from pantry) in date range
    const { data: consumed } = await sb
      .from("detection_history")
      .select("item_name, detected_at, nutritional_data, quantity")
      .eq("user_id", userId)
      .in("action", ["removed", "consumed"])
      .gte("detected_at", start.toISOString())
      .lte("detected_at", end.toISOString())
      .order("detected_at", { ascending: true });

    // Build per-day totals
    const dayMap: Record<string, { calories: number; protein: number; fat: number; carbs: number; fiber: number; sodium: number; sugar: number; vitamin_c: number; calcium: number; iron: number; items: string[] }> = {};

    for (const event of consumed || []) {
      const day = event.detected_at.slice(0, 10); // YYYY-MM-DD
      if (!dayMap[day]) dayMap[day] = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0, sugar: 0, vitamin_c: 0, calcium: 0, iron: 0, items: [] };

      // Find matching pantry item for nutrition data if not explicitly provided
      const match = (pantryItems || []).find(
        (p) => p.name.toLowerCase() === event.item_name.toLowerCase()
      );

      const qty = event.quantity || 1; // Default to 1 if missing

      // If nutritional_data is provided directly in the event (like for manually consumed items), use it
      if (event.nutritional_data) {
        dayMap[day].calories  += event.nutritional_data.calories  || 0;
        dayMap[day].protein   += event.nutritional_data.protein   || 0;
        dayMap[day].fat       += event.nutritional_data.fat       || 0;
        dayMap[day].carbs     += event.nutritional_data.carbs     || 0;
        dayMap[day].fiber     += event.nutritional_data.fiber     || 0;
        dayMap[day].sodium    += event.nutritional_data.sodium    || 0;
        dayMap[day].sugar     += event.nutritional_data.sugar     || 0;
        dayMap[day].vitamin_c += event.nutritional_data.vitamin_c || 0;
        dayMap[day].calcium   += event.nutritional_data.calcium   || 0;
        dayMap[day].iron      += event.nutritional_data.iron      || 0;
      } else {
        // Assume 100g serving per detection event fallback
        dayMap[day].calories += (match?.calories_per_100g || 0) * qty;
        dayMap[day].protein  += (match?.protein_per_100g  || 0) * qty;
        dayMap[day].fat      += (match?.fat_per_100g      || 0) * qty;
        dayMap[day].carbs    += (match?.carbs_per_100g    || 0) * qty;
        dayMap[day].fiber    += (match?.fiber_per_100g    || 0) * qty;
        // sodium/sugar/vitamins not in pantry schema, default to 0
      }
      dayMap[day].items.push(event.item_name);
    }

    // Totals across the range
    const totals = Object.values(dayMap).reduce(
      (acc, d) => ({
        calories:  acc.calories  + d.calories,
        protein:   acc.protein   + d.protein,
        fat:       acc.fat       + d.fat,
        carbs:     acc.carbs     + d.carbs,
        fiber:     acc.fiber     + d.fiber,
        sodium:    acc.sodium    + d.sodium,
        sugar:     acc.sugar     + d.sugar,
        vitamin_c: acc.vitamin_c + d.vitamin_c,
        calcium:   acc.calcium   + d.calcium,
        iron:      acc.iron      + d.iron,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0, sugar: 0, vitamin_c: 0, calcium: 0, iron: 0 }
    );

    // Today's calorie total for the budget ring
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayCalories = Math.round(dayMap[todayKey]?.calories || 0);

    const days = Object.entries(dayMap).map(([date, data]) => ({ date, ...data }));

    return NextResponse.json({
      userId,
      range: { start: start.toISOString(), end: end.toISOString() },
      dailyCalorieGoal,
      todayCalories,
      totals: {
        calories:  Math.round(totals.calories),
        protein:   Math.round(totals.protein   * 10) / 10,
        fat:       Math.round(totals.fat        * 10) / 10,
        carbs:     Math.round(totals.carbs      * 10) / 10,
        fiber:     Math.round(totals.fiber      * 10) / 10,
        sodium:    Math.round(totals.sodium     * 10) / 10,
        sugar:     Math.round(totals.sugar      * 10) / 10,
        vitamin_c: Math.round(totals.vitamin_c  * 10) / 10,
        calcium:   Math.round(totals.calcium    * 10) / 10,
        iron:      Math.round(totals.iron       * 10) / 10,
      },
      days,
      pantrySnapshot: pantryItems || [],
    });
  } catch (err) {
    console.error("Nutrition aggregate error:", err);
    return NextResponse.json({ error: "Failed to aggregate nutrition data" }, { status: 500 });
  }
}
