import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
    }

    const USDA_API_KEY = process.env.USDA_API_KEY;
    if (!USDA_API_KEY) {
      return NextResponse.json({ error: "USDA API key not configured" }, { status: 500 });
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    const notFound = [];

    for (const item of items) {
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(item.food)}&pageSize=1`);
      const data = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        const multiplier = (item.quantity || 100) / 100.0;
        
        for (const nutrient of food.foodNutrients) {
          const name = nutrient.nutrientName.toLowerCase();
          const amount = (nutrient.value || 0) * multiplier;
          
          if (name.includes('energy') && nutrient.unitName === 'kcal') totalCalories += amount;
          else if (name === 'protein') totalProtein += amount;
          else if (name === 'total lipid (fat)') totalFat += amount;
          else if (name.includes('carbohydrate, by difference')) totalCarbs += amount;
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
      not_found: notFound
    });

  } catch (error) {
    console.error("USDA API Error:", error);
    return NextResponse.json({ error: "Failed to calculate nutrition" }, { status: 500 });
  }
}
