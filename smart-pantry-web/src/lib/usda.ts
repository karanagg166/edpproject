export async function fetchUSDANutrition(itemName: string) {
  const usdaApiKey = process.env.USDA_API_KEY;
  if (!usdaApiKey) {
    console.warn("⚠️ No USDA_API_KEY set, skipping nutrition lookup");
    return {};
  }

  try {
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(itemName)}&pageSize=1&api_key=${usdaApiKey}`;
    const res = await fetch(usdaUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        const nutrients = food.foodNutrients || [];
        
        const getNutrient = (name: string) => {
          const n = nutrients.find((n: any) => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
          return n ? n.value : 0;
        };

        return {
          calories_per_100g: getNutrient("energy"),
          protein_per_100g: getNutrient("protein"),
          fat_per_100g: getNutrient("lipid"),
          carbs_per_100g: getNutrient("carbohydrate"),
          fiber_per_100g: getNutrient("fiber")
        };
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch USDA nutrition:", err);
  }
  return {};
}
