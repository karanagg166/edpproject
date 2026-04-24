export type UnitInfo = { unit: string; defaultQuantity: number };

const UNIT_RULES: Record<string, UnitInfo> = {
  // Liquids
  milk: { unit: "litres", defaultQuantity: 1 },
  juice: { unit: "litres", defaultQuantity: 1 },
  oil: { unit: "litres", defaultQuantity: 1 },
  water: { unit: "litres", defaultQuantity: 1 },
  sauce: { unit: "litres", defaultQuantity: 1 },
  vinegar: { unit: "litres", defaultQuantity: 1 },
  syrup: { unit: "litres", defaultQuantity: 1 },

  // By weight
  chicken: { unit: "kg", defaultQuantity: 0.5 },
  mutton: { unit: "kg", defaultQuantity: 0.5 },
  fish: { unit: "kg", defaultQuantity: 0.5 },
  beef: { unit: "kg", defaultQuantity: 0.5 },
  pork: { unit: "kg", defaultQuantity: 0.5 },
  meat: { unit: "kg", defaultQuantity: 0.5 },
  rice: { unit: "kg", defaultQuantity: 1 },
  flour: { unit: "kg", defaultQuantity: 1 },
  sugar: { unit: "kg", defaultQuantity: 1 },
  salt: { unit: "kg", defaultQuantity: 1 },
  lentils: { unit: "kg", defaultQuantity: 1 },
  dal: { unit: "kg", defaultQuantity: 1 },
  oats: { unit: "kg", defaultQuantity: 1 },
  butter: { unit: "grams", defaultQuantity: 200 },
  cheese: { unit: "grams", defaultQuantity: 200 },
  paneer: { unit: "grams", defaultQuantity: 200 },
};

// Fallback by category
const CATEGORY_UNIT_DEFAULTS: Record<string, UnitInfo> = {
  fruits: { unit: "count", defaultQuantity: 1 },
  vegetables: { unit: "count", defaultQuantity: 1 },
  dairy: { unit: "litres", defaultQuantity: 1 },
  meat_poultry: { unit: "kg", defaultQuantity: 0.5 },
  grains: { unit: "kg", defaultQuantity: 1 },
  snacks: { unit: "packets", defaultQuantity: 1 },
  other: { unit: "count", defaultQuantity: 1 },
};

export function getUnitInfo(itemName: string, category: string = "other"): UnitInfo {
  const normalized = itemName.toLowerCase();
  
  // 1. Check specific item rules
  for (const [key, info] of Object.entries(UNIT_RULES)) {
    if (normalized.includes(key)) {
      return info;
    }
  }

  // 2. Check general keywords for packets/boxes
  if (normalized.includes("packet") || normalized.includes("box") || normalized.includes("pack")) {
    return { unit: "packets", defaultQuantity: 1 };
  }

  if (normalized.includes("bottle") || normalized.includes("can")) {
    return { unit: "count", defaultQuantity: 1 };
  }

  // 3. Fallback to category defaults
  if (CATEGORY_UNIT_DEFAULTS[category]) {
    return CATEGORY_UNIT_DEFAULTS[category];
  }

  // 4. Ultimate fallback
  return { unit: "count", defaultQuantity: 1 };
}
