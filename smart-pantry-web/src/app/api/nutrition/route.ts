import { NextResponse } from 'next/server';
import { fetchUSDANutrition } from '@/lib/usda';
import { getServingSize } from '@/lib/food_db';

function parseFoodAndQuantity(input: string) {
  // Simple parser: "5 bananas", "1.5 kg rice", "chicken"
  const match = input.trim().match(/^([\d.]+)\s*(kg|g|lb|oz)?\s+(.+)$/i);
  if (match) {
    const qty = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();
    const food = match[3];
    return { quantity: qty, unit, food };
  }
  return { quantity: 1, unit: null, food: input.trim() };
}

export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    const notFound = [];

    // Assuming we only get 1 item from the frontend's lookup tab usually
    let firstItemData = null;

    for (const item of items) {
      const parsed = parseFoodAndQuantity(item.food);
      const data = await fetchUSDANutrition(parsed.food);
      
      if (data && data.calories_per_100g !== undefined) {
        let servingSizeG = getServingSize(parsed.food);
        
        let multiplier = 1;
        if (parsed.unit === 'kg') multiplier = (parsed.quantity * 1000) / 100;
        else if (parsed.unit === 'g') multiplier = parsed.quantity / 100;
        else if (parsed.unit === 'lb') multiplier = (parsed.quantity * 453.592) / 100;
        else if (parsed.unit === 'oz') multiplier = (parsed.quantity * 28.3495) / 100;
        else {
          // Count based
          multiplier = (servingSizeG * parsed.quantity) / 100;
        }

        const cal = (data.calories_per_100g || 0);
        const pro = (data.protein_per_100g || 0);
        const fat = (data.fat_per_100g || 0);
        const carb = (data.carbs_per_100g || 0);

        totalCalories += cal * multiplier;
        totalProtein += pro * multiplier;
        totalFat += fat * multiplier;
        totalCarbs += carb * multiplier;

        if (!firstItemData) {
          firstItemData = {
            serving_size_g: servingSizeG,
            parsed_qty: parsed.quantity,
            calories_per_100g: cal,
            protein_per_100g: pro,
            fat_per_100g: fat,
            carbs_per_100g: carb,
            calories_per_item: Math.round(cal * (servingSizeG / 100)),
            protein_per_item: Math.round(pro * (servingSizeG / 100) * 10) / 10,
            fat_per_item: Math.round(fat * (servingSizeG / 100) * 10) / 10,
            carbs_per_item: Math.round(carb * (servingSizeG / 100) * 10) / 10,
          };
        }

      } else {
        notFound.push(item.food);
      }
    }

    return NextResponse.json({
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      not_found: notFound,
      item_data: firstItemData
    });

  } catch (error) {
    console.error("Nutrition Calculation Error:", error);
    return NextResponse.json({ error: "Failed to calculate nutrition" }, { status: 500 });
  }
}
