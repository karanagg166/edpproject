import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { item_name, quantity = 1, calories = 0, protein = 0, fat = 0, carbs = 0,
            fiber = 0, sodium = 0, sugar = 0, vitamin_c = 0, calcium = 0, iron = 0,
            meal_type = "snack" } = body;

    if (!item_name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const sb = await createSupabaseServer();
    
    // Convert nutritional data to numbers and multiply by quantity if needed. 
    // Wait, the UI might send total calories or per 100g. We will expect the UI to send the total consumed nutritional values.

    const { data, error } = await sb
      .from("detection_history")
      .insert({
        user_id: user.id,
        item_name: item_name.toLowerCase(),
        action: "consumed",
        detection_type: "manual",
        status: "done",
        meal_type,
        quantity: Number(quantity),
        confidence: 1.0,
        detected_at: new Date().toISOString(),
        nutritional_data: {
          calories:  Number(calories),
          protein:   Number(protein),
          fat:       Number(fat),
          carbs:     Number(carbs),
          fiber:     Number(fiber),
          sodium:    Number(sodium),
          sugar:     Number(sugar),
          vitamin_c: Number(vitamin_c),
          calcium:   Number(calcium),
          iron:      Number(iron),
        }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, entry: data });
  } catch (error: any) {
    console.error("Error logging consumed item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = parseInt(searchParams.get("range") || "7");

    const sb = await createSupabaseServer();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range);

    const { data, error } = await sb
      .from("detection_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("action", "consumed")
      .gte("detected_at", cutoffDate.toISOString())
      .order("detected_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ consumed: data });
  } catch (error: any) {
    console.error("Error fetching consumed items:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const sb = await createSupabaseServer();
    
    const { error } = await sb
      .from("detection_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting consumed item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
