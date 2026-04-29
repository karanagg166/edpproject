import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const since = url.searchParams.get("since"); // ISO timestamp
    const userId = url.searchParams.get("user_id") || "user_1";

    let query = supabase
      .from("fridge_gas_readings")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gte("recorded_at", since);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
