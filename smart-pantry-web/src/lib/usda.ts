export async function fetchUSDANutrition(itemName: string, category?: string) {
  const usdaApiKey = process.env.USDA_API_KEY;
  if (!usdaApiKey) {
    console.warn("⚠️ No USDA_API_KEY set, skipping nutrition lookup");
    return {};
  }

  try {
    let query = itemName;
    if (category && ["fruits", "vegetables", "meat_poultry", "seafood"].includes(category)) {
      query += ", raw";
    }

    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=3&dataType=Foundation,SR%20Legacy&api_key=${usdaApiKey}`;
    const res = await fetch(usdaUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.foods && data.foods.length > 0) {
        
        // Score items
        const scoredFoods = data.foods.map((food: any) => {
          let score = 0;
          const desc = food.description.toLowerCase();
          const search_term = itemName.toLowerCase();
          
          if (desc === search_term) score += 100;
          if (desc.includes(search_term)) score += 10;
          if (desc.includes("raw")) score += 20;
          if (desc.includes("fried") || desc.includes("chips") || desc.includes("cooked") || desc.includes("processed")) score -= 30;
          
          return { ...food, _score: score };
        });
        
        scoredFoods.sort((a: any, b: any) => b._score - a._score);
        const food = scoredFoods[0];

        const nutrients = food.foodNutrients || [];
        
        const getNutrient = (name: string) => {
          const n = nutrients.find((n: any) => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
          return n ? n.value : 0;
        };

        return {
          calories_per_100g: getNutrient("energy"),
          protein_per_100g:  getNutrient("protein"),
          fat_per_100g:      getNutrient("lipid"),
          carbs_per_100g:    getNutrient("carbohydrate"),
          fiber_per_100g:    getNutrient("fiber"),
          sodium_per_100g:   getNutrient("sodium"),
          sugar_per_100g:    getNutrient("sugars, total"),
          vitamin_c_per_100g: getNutrient("vitamin c"),
          calcium_per_100g:  getNutrient("calcium"),
          iron_per_100g:     getNutrient("iron"),
        };
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch USDA nutrition:", err);
  }
  return {};
}
