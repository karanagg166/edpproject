import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchUSDANutrition } from "@/lib/usda";

// Service-role client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
  const cookieStore = await cookies(); // ✅ Next.js 15 — must be awaited
  console.log("[getAuthUser] all cookies:", cookieStore.getAll().map(c => c.name));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch { }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: "", ...options }); } catch { }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) console.error("[getAuthUser] error:", error.message);
  console.log("[getAuthUser] resolved user:", user?.id ?? "null — cookie not found or invalid");

  return user;
}

// GET /api/pantry
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    console.error("[GET /api/pantry] Unauthorized — no valid session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[GET /api/pantry] Fetching for user:", user.id);
  const { data, error } = await supabaseAdmin
    .from("pantry")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    console.error("[GET /api/pantry] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[GET /api/pantry] Returning", data.length, "items");
  return NextResponse.json(data);
}

// POST /api/pantry
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    console.error("[POST /api/pantry] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("[POST /api/pantry] Adding item:", body.name, "for user:", user.id);

  const nutritionData = await fetchUSDANutrition(body.name);

  const { data, error } = await supabaseAdmin
    .from("pantry")
    .insert({
      name: body.name,
      quantity: body.quantity ?? 1,
      category: body.category ?? "other",
      storage_type: body.storage_type ?? "fridge",
      expiry_date: body.expiry_date || null,
      user_id: user.id,
      ...nutritionData,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/pantry] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[POST /api/pantry] Item added:", data.id);
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/pantry?id=<uuid>
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    console.error("[DELETE /api/pantry] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  console.log("[DELETE /api/pantry] Deleting item:", id, "for user:", user.id);

  const { data: existing } = await supabaseAdmin
    .from("pantry")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    console.error("[DELETE /api/pantry] Item not found or doesn't belong to user");
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from("pantry").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/pantry] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[DELETE /api/pantry] Deleted successfully");
  return NextResponse.json({ success: true });
}