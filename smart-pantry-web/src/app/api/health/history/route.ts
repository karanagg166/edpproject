import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { getAuthUser } from "@/lib/auth-guard";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7"; // days

  const since = new Date();
  since.setDate(since.getDate() - parseInt(range));

  const { data, error } = await sb
    .from("health_scores")
    .select("score, protein_score, carb_score, fat_score, micro_score, feedback, scored_at")
    .eq("user_id", userId)
    .gte("scored_at", since.toISOString())
    .order("scored_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ history: data || [] });
}
