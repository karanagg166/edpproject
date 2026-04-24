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

    // Fetch pantry items (currently in stock)
    const { data: pantryItems } = await sb
      .from("pantry")
      .select("name, quantity, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, category")
      .eq("user_id", userId);

    // Fetch consumed items (removed from pantry) in date range
    const { data: consumed } = await sb
      .from("detection_history")
      .select("item_name, detected_at")
      .eq("user_id", userId)
      .eq("action", "removed")
      .gte("detected_at", start.toISOString())
      .lte("detected_at", end.toISOString())
      .order("detected_at", { ascending: true });

    // Build per-day totals
    const dayMap: Record<string, { calories: number; protein: number; fat: number; carbs: number; fiber: number; items: string[] }> = {};

    for (const event of consumed || []) {
      const day = event.detected_at.slice(0, 10); // YYYY-MM-DD
      if (!dayMap[day]) dayMap[day] = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, items: [] };

      // Find matching pantry item for nutrition data
      const match = (pantryItems || []).find(
        (p) => p.name.toLowerCase() === event.item_name.toLowerCase()
      );

      // Assume 100g serving per detection event
      dayMap[day].calories += match?.calories_per_100g || 0;
      dayMap[day].protein  += match?.protein_per_100g  || 0;
      dayMap[day].fat      += match?.fat_per_100g      || 0;
      dayMap[day].carbs    += match?.carbs_per_100g    || 0;
      dayMap[day].fiber    += match?.fiber_per_100g    || 0;
      dayMap[day].items.push(event.item_name);
    }

    // Totals across the range
    const totals = Object.values(dayMap).reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        fat: acc.fat + d.fat,
        carbs: acc.carbs + d.carbs,
        fiber: acc.fiber + d.fiber,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
    );

    const days = Object.entries(dayMap).map(([date, data]) => ({ date, ...data }));

    return NextResponse.json({
      userId,
      range: { start: start.toISOString(), end: end.toISOString() },
      totals: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fiber: Math.round(totals.fiber * 10) / 10,
      },
      days,
      pantrySnapshot: pantryItems || [],
    });
  } catch (err) {
    console.error("Nutrition aggregate error:", err);
    return NextResponse.json({ error: "Failed to aggregate nutrition data" }, { status: 500 });
  }
}
