import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id") || "user_1";

    const [gasRes, doorRes, accessRes, alertRes] = await Promise.all([
      supabase
        .from("fridge_gas_readings")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(1),
      supabase
        .from("fridge_door_events")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(1),
      supabase
        .from("fridge_access_logs")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(1),
      supabase
        .from("fridge_spoilage_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(1),
    ]);

    const latestGas = gasRes.data?.[0] || null;
    const latestDoor = doorRes.data?.[0] || null;
    const latestAccess = accessRes.data?.[0] || null;
    const latestAlert = alertRes.data?.[0] || null;

    // Determine if device is online (last reading within 30 seconds)
    let online = false;
    if (latestGas?.recorded_at) {
      const lastSeen = new Date(latestGas.recorded_at).getTime();
      online = Date.now() - lastSeen < 30000;
    }

    return NextResponse.json({
      online,
      lastSeen: latestGas?.recorded_at || null,
      gas: latestGas
        ? { mq2: latestGas.mq2_percent, mq3: latestGas.mq3_percent }
        : null,
      door: latestDoor
        ? { state: latestDoor.door_state, distance: latestDoor.distance_cm, at: latestDoor.recorded_at }
        : null,
      lastAccess: latestAccess
        ? {
            cardUid: latestAccess.card_uid,
            granted: latestAccess.access_granted,
            userType: latestAccess.user_type,
            at: latestAccess.recorded_at,
          }
        : null,
      lastAlert: latestAlert
        ? {
            shelf: latestAlert.shelf,
            mq2: latestAlert.mq2_percent,
            mq3: latestAlert.mq3_percent,
            nightMode: latestAlert.night_mode,
            at: latestAlert.recorded_at,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
