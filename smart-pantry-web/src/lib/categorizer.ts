const CATEGORY_RULES: Record<string, string[]> = {
  fruits: ["apple", "banana", "mango", "orange", "grape", "berry", "melon", "pear", "peach", "plum", "lemon", "lime", "kiwi", "avocado"],
  vegetables: ["tomato", "potato", "onion", "carrot", "spinach", "broccoli", "lettuce", "cabbage", "pepper", "garlic", "ginger", "celery", "corn", "cucumber", "zucchini", "squash", "eggplant", "mushroom"],
  dairy: ["milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "paneer", "curd", "ghee", "whey"],
  meat_poultry: ["chicken", "mutton", "lamb", "beef", "pork", "fish", "prawn", "egg", "shrimp", "salmon", "tuna", "turkey", "bacon", "sausage", "meat", "hot dog"],
  grains: ["rice", "wheat", "flour", "bread", "pasta", "oats", "cereal", "noodle", "quinoa", "barley", "maize", "sandwich", "bagel", "baked goods", "pizza", "burger"],
  snacks: ["chips", "biscuit", "cookie", "chocolate", "candy", "popcorn", "pretzel", "cracker", "nut", "seed", "donut", "cake"],
  beverages: ["water", "soda", "juice", "coffee", "tea", "beer", "wine", "drink", "beverage", "bottle", "wine glass", "cup"],
};

export function categorizeItem(itemName: string): string {
  const normalized = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      return category;
    }
  }
  return "other";
}
