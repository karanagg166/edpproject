import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchUSDANutrition } from "@/lib/usda";
import { normalizeItemName, findBestMatch } from "@/lib/item-normalizer";
import { categorizeItem } from "@/lib/categorizer";
import { getUnitInfo } from "@/lib/units";
import { getShelfLife, getServingSize } from "@/lib/food_db";

// Service-role client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Ignored when called from a Server Component.
          }
        },
      },
    }
  );

  // Retry up to 2 times on transient network errors (e.g. socket closed)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("[getAuthUser] error:", error.message);
        return null;
      }
      return user;
    } catch (err: any) {
      const isLast = attempt === 2;
      if (isLast) {
        console.error("[getAuthUser] fetch failed after retries:", err?.cause?.code ?? err?.message);
        return null;
      }
      // Brief backoff before retry (100ms, 300ms)
      await new Promise((r) => setTimeout(r, (attempt + 1) * 100));
    }
  }
  return null;
}

// GET /api/pantry
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("pantry")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const dataWithServingSize = data.map(item => ({
    ...item,
    serving_size_g: getServingSize(item.name)
  }));

  return NextResponse.json(dataWithServingSize);
}

// POST /api/pantry
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawName = body.name;
  const normalizedName = normalizeItemName(rawName) || rawName;

  // 1. Fetch existing pantry for fuzzy matching
  const { data: existingPantry } = await supabaseAdmin
    .from("pantry")
    .select("id, name, quantity")
    .eq("user_id", user.id);

  const match = findBestMatch(normalizedName, existingPantry || []);

  const addedQuantity = body.quantity ?? 1;

  if (match) {
    // 2. Update existing item
    const { data, error } = await supabaseAdmin
      .from("pantry")
      .update({ quantity: match.quantity + addedQuantity })
      .eq("id", match.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 200 });
  }

  // Auto-categorize if not explicitly provided or provided as generic "other"
  const category = (body.category && body.category !== "other" && body.category !== "fruits") 
    ? body.category 
    : categorizeItem(rawName);

  // 3. Create new item
  const nutritionData = await fetchUSDANutrition(rawName, category);
  
  const unitInfo = getUnitInfo(rawName, category);

  const storageType = body.storage_type ?? "fridge";
  let expiryDate = body.expiry_date || null;
  
  if (!expiryDate) {
    const shelfLifeDays = getShelfLife(rawName, storageType) || 7; // Default to 7 days if unknown
    const date = new Date();
    date.setDate(date.getDate() + shelfLifeDays);
    expiryDate = date.toISOString().split('T')[0];
  }

  const { data, error } = await supabaseAdmin
    .from("pantry")
    .insert({
      name: rawName, // Keep original casing
      quantity: body.quantity ?? unitInfo.defaultQuantity,
      unit: unitInfo.unit,
      category: category,
      storage_type: storageType,
      expiry_date: expiryDate,
      user_id: user.id,
      calories_per_100g: nutritionData.calories_per_100g || 0,
      protein_per_100g: nutritionData.protein_per_100g || 0,
      fat_per_100g: nutritionData.fat_per_100g || 0,
      carbs_per_100g: nutritionData.carbs_per_100g || 0,
      fiber_per_100g: nutritionData.fiber_per_100g || 0,
      nutrition_data: nutritionData,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/pantry?id=<uuid>&quantity=<number>
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  const quantityToRemoveParam = req.nextUrl.searchParams.get("quantity");
  
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("pantry")
    .select("id, quantity")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const removeQty = quantityToRemoveParam ? parseInt(quantityToRemoveParam, 10) : existing.quantity;

  if (removeQty > 0 && removeQty < existing.quantity) {
    // Partial remove
    const { data, error } = await supabaseAdmin
      .from("pantry")
      .update({ quantity: existing.quantity - removeQty })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "updated", item: data });
  } else {
    // Full remove
    const { error } = await supabaseAdmin.from("pantry").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "deleted" });
  }
}