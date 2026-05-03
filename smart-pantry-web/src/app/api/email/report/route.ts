import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth-guard";
import { sendPantryReportEmail } from "@/lib/email";
import { ReportType } from "@/emails/PantryReportEmail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const reportType: ReportType = body.reportType ?? "pantry";
    const expiringDays: number = Math.max(1, Math.min(30, parseInt(body.expiringDays ?? "3", 10)));

    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      null;

    // Fetch pantry items
    const { data: allItems, error } = await supabaseAdmin
      .from("pantry")
      .select("id, name, category, quantity, storage_type, expiry_date")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Pantry fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch pantry items" }, { status: 500 });
    }

    let items = allItems ?? [];

    if (reportType === "expiring") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + expiringDays);

      items = items.filter((item) => {
        if (!item.expiry_date) return false;
        const expiry = new Date(item.expiry_date);
        return expiry <= cutoff; // includes already expired
      });

      // Sort by expiry date ascending
      items.sort((a, b) =>
        (a.expiry_date ?? "").localeCompare(b.expiry_date ?? "")
      );
    }

    const result = await sendPantryReportEmail(
      user.email,
      displayName,
      items,
      reportType,
      expiringDays
    );

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      itemCount: items.length,
      sentTo: user.email,
    });
  } catch (err: any) {
    console.error("Email report error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
