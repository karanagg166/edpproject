import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const userId = url.searchParams.get("user_id") || "user_1";

    const { data, error } = await supabase
      .from("fridge_access_logs")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
