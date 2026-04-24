import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchUSDANutrition } from "@/lib/usda";
import { normalizeItemName, findBestMatch } from "@/lib/item-normalizer";
import { categorizeItem } from "@/lib/categorizer";
import { getUnitInfo } from "@/lib/units";

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
            // The `setAll` method was called from a Server Component.
          }
        },
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
    const { detection_id, action, storage_type } = await req.json();

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
    const rawName = detection.item_name;
    const normalizedName = normalizeItemName(rawName) || rawName;

    // Recalculate expiry if storage_type is provided
    let finalStorageType = storage_type || detection.storage_type || "fridge";
    let finalExpiryDate = detection.expiry_date;
    
    if (storage_type && storage_type !== detection.storage_type) {
      const { getShelfLife } = require("@/lib/food_db");
      const shelfLifeDays = getShelfLife(rawName, storage_type);
      if (shelfLifeDays) {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + shelfLifeDays);
        finalExpiryDate = newExpiry.toISOString().split("T")[0];
      }
    }

    // We fetch existing items to fuzzy match against
    const { data: existingPantry } = await supabaseAdmin
      .from("pantry")
      .select("id, name, quantity, expiry_date, unit")
      .eq("user_id", user.id);

    let existingItems = existingPantry || [];
    
    // Distinguish barcode items and items with expiry dates
    if (finalExpiryDate) {
       // Only group with items having the same exact expiry date to preserve uniqueness
       existingItems = existingItems.filter(item => item.expiry_date === finalExpiryDate);
    } else if (detection.detection_type === "barcode") {
       // If it's a barcode but no expiry date, try to group with items that have NO expiry date
       existingItems = existingItems.filter(item => !item.expiry_date);
    }

    const match = findBestMatch(normalizedName, existingItems);

    if (action === "added") {
      // Build item payload
      const nutrition = await fetchUSDANutrition(rawName);
      
      const category = (detection.category && detection.category !== "other" && detection.category !== "fruits") 
        ? detection.category 
        : categorizeItem(rawName);

      const unitInfo = getUnitInfo(rawName, category);

      const itemData = {
        user_id: user.id,
        name: rawName,
        category: category,
        storage_type: finalStorageType,
        expiry_date: finalExpiryDate || null,
        quantity: unitInfo.defaultQuantity,
        unit: unitInfo.unit,
        ...nutrition
      };

      if (match) {
        // Increment quantity
        const { data: updated } = await supabaseAdmin
          .from("pantry")
          .update({ quantity: match.quantity + unitInfo.defaultQuantity })
          .eq("id", match.id)
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
      if (match) {
        const category = categorizeItem(rawName);
        const unitInfo = getUnitInfo(rawName, category);
        const removeQty = unitInfo.defaultQuantity;

        if (match.quantity <= removeQty) {
          await supabaseAdmin.from("pantry").delete().eq("id", match.id);
        } else {
          const { data: updated } = await supabaseAdmin
            .from("pantry")
            .update({ quantity: match.quantity - removeQty })
            .eq("id", match.id)
            .select()
            .single();
          pantryItem = updated;
        }
      } else {
        // Validation: Cannot remove an item that isn't in the pantry
        return NextResponse.json({ error: "No items to remove" }, { status: 400 });
      }
    } else if (action === "dismissed") {
      // Just updating the history, no pantry operation needed
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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
