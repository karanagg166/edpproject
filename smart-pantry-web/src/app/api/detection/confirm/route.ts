import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchUSDANutrition } from "@/lib/usda";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
  const cookieStore = await cookies();
  console.log("[getAuthUser] all cookies:", cookieStore.getAll().map(c => c.name));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch { } },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: "", ...options }); } catch { } },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { detection_id, action } = await req.json();

    if (!detection_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the detection row
    const { data: detection, error: fetchErr } = await supabaseAdmin
      .from("detection_history")
      .select("*")
      .eq("id", detection_id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (fetchErr || !detection) {
      return NextResponse.json({ error: "Detection not found or already processed" }, { status: 404 });
    }

    let pantryItem = null;

    if (action === "added") {
      // Build item payload
      const nutrition = await fetchUSDANutrition(detection.item_name);

      const itemData = {
        user_id: user.id,
        name: detection.item_name,
        category: detection.category || "other",
        storage_type: detection.storage_type || "fridge",
        expiry_date: detection.expiry_date || null,
        quantity: 1,
        ...nutrition
      };

      // Check if item already exists
      const { data: existing } = await supabaseAdmin
        .from("pantry")
        .select("id, quantity")
        .eq("user_id", user.id)
        .ilike("name", detection.item_name)
        .single();

      if (existing) {
        // Increment quantity
        const { data: updated } = await supabaseAdmin
          .from("pantry")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id)
          .select()
          .single();
        pantryItem = updated;
      } else {
        // Insert new
        const { data: inserted } = await supabaseAdmin
          .from("pantry")
          .insert(itemData)
          .select()
          .single();
        pantryItem = inserted;
      }

    } else if (action === "removed") {
      // Find item in pantry
      const { data: existing } = await supabaseAdmin
        .from("pantry")
        .select("id, quantity")
        .eq("user_id", user.id)
        .ilike("name", detection.item_name)
        .single();

      if (existing) {
        if (existing.quantity <= 1) {
          await supabaseAdmin.from("pantry").delete().eq("id", existing.id);
        } else {
          const { data: updated } = await supabaseAdmin
            .from("pantry")
            .update({ quantity: existing.quantity - 1 })
            .eq("id", existing.id)
            .select()
            .single();
          pantryItem = updated;
        }
      }
    }

    // Update detection status
    await supabaseAdmin
      .from("detection_history")
      .update({ status: "confirmed", action })
      .eq("id", detection_id);

    return NextResponse.json({ success: true, pantryItem, action });

  } catch (error: any) {
    console.error("[API /detection/confirm] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
