/**
 * produce-library.ts
 *
 * Offline, static library of ~80 common fresh produce items.
 * Used by ProducePicker when no barcode is scanned (loose fruits/vegetables).
 *
 * Each entry is designed to map directly to a CachedProduct shape,
 * so it can be saved to barcode_cache using a synthetic barcode "PRODUCE-<id>".
 */

export interface ProduceItem {
  id: string;
  name: string;
  nameHi?: string; // Hindi/regional name
  category: "fruits" | "vegetables" | "herbs" | "nuts_seeds";
  emoji: string;
  // Per 100g nutritional estimates (FAO/USDA averages)
  calories_100g: number;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
  // Default quantity to add (1 unit or 100g)
  defaultQuantity: number;
  defaultUnit: "g" | "kg" | "pcs";
}

export const PRODUCE_LIBRARY: ProduceItem[] = [
  // ─── Fruits ─────────────────────────────────────────────────────────────────
  { id: "apple",       name: "Apple",         nameHi: "सेब",      category: "fruits",     emoji: "🍎", calories_100g: 52,  protein_100g: 0.3, fat_100g: 0.2, carbs_100g: 14,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "banana",      name: "Banana",        nameHi: "केला",     category: "fruits",     emoji: "🍌", calories_100g: 89,  protein_100g: 1.1, fat_100g: 0.3, carbs_100g: 23,  defaultQuantity: 120, defaultUnit: "g" },
  { id: "orange",      name: "Orange",        nameHi: "संतरा",    category: "fruits",     emoji: "🍊", calories_100g: 47,  protein_100g: 0.9, fat_100g: 0.1, carbs_100g: 12,  defaultQuantity: 180, defaultUnit: "g" },
  { id: "mango",       name: "Mango",         nameHi: "आम",       category: "fruits",     emoji: "🥭", calories_100g: 60,  protein_100g: 0.8, fat_100g: 0.4, carbs_100g: 15,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "grapes",      name: "Grapes",        nameHi: "अंगूर",    category: "fruits",     emoji: "🍇", calories_100g: 67,  protein_100g: 0.6, fat_100g: 0.4, carbs_100g: 17,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "watermelon",  name: "Watermelon",    nameHi: "तरबूज़",   category: "fruits",     emoji: "🍉", calories_100g: 30,  protein_100g: 0.6, fat_100g: 0.2, carbs_100g:  8,  defaultQuantity: 300, defaultUnit: "g" },
  { id: "papaya",      name: "Papaya",        nameHi: "पपीता",   category: "fruits",     emoji: "🪴", calories_100g: 43,  protein_100g: 0.5, fat_100g: 0.3, carbs_100g: 11,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "guava",       name: "Guava",         nameHi: "अमरूद",   category: "fruits",     emoji: "🍈", calories_100g: 68,  protein_100g: 2.6, fat_100g: 1.0, carbs_100g: 14,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "pomegranate", name: "Pomegranate",   nameHi: "अनार",     category: "fruits",     emoji: "🍑", calories_100g: 83,  protein_100g: 1.7, fat_100g: 1.2, carbs_100g: 19,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "pineapple",   name: "Pineapple",     nameHi: "अनानास",   category: "fruits",     emoji: "🍍", calories_100g: 50,  protein_100g: 0.5, fat_100g: 0.1, carbs_100g: 13,  defaultQuantity: 250, defaultUnit: "g" },
  { id: "strawberry",  name: "Strawberry",    nameHi: "स्ट्रॉबेरी", category: "fruits",  emoji: "🍓", calories_100g: 32,  protein_100g: 0.7, fat_100g: 0.3, carbs_100g:  8,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "lemon",       name: "Lemon",         nameHi: "नींबू",    category: "fruits",     emoji: "🍋", calories_100g: 29,  protein_100g: 1.1, fat_100g: 0.3, carbs_100g:  9,  defaultQuantity: 60,  defaultUnit: "g" },
  { id: "lychee",      name: "Lychee",        nameHi: "लीची",     category: "fruits",     emoji: "🍒", calories_100g: 66,  protein_100g: 0.8, fat_100g: 0.4, carbs_100g: 17,  defaultQuantity: 100, defaultUnit: "g" },
  { id: "jackfruit",   name: "Jackfruit",     nameHi: "कटहल",     category: "fruits",     emoji: "🫐", calories_100g: 95,  protein_100g: 1.7, fat_100g: 0.6, carbs_100g: 23,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "coconut",     name: "Coconut",       nameHi: "नारियल",   category: "fruits",     emoji: "🥥", calories_100g: 354, protein_100g: 3.3, fat_100g:33.5, carbs_100g: 15,  defaultQuantity: 100, defaultUnit: "g" },
  { id: "pear",        name: "Pear",          nameHi: "नाशपाती",  category: "fruits",     emoji: "🍐", calories_100g: 57,  protein_100g: 0.4, fat_100g: 0.1, carbs_100g: 15,  defaultQuantity: 180, defaultUnit: "g" },
  { id: "plum",        name: "Plum",          nameHi: "आलूबुखारा", category: "fruits",    emoji: "🍑", calories_100g: 46,  protein_100g: 0.7, fat_100g: 0.3, carbs_100g: 11,  defaultQuantity: 100, defaultUnit: "g" },
  { id: "kiwi",        name: "Kiwi",          nameHi: "कीवी",     category: "fruits",     emoji: "🥝", calories_100g: 61,  protein_100g: 1.1, fat_100g: 0.5, carbs_100g: 15,  defaultQuantity: 100, defaultUnit: "g" },

  // ─── Vegetables ──────────────────────────────────────────────────────────────
  { id: "tomato",      name: "Tomato",        nameHi: "टमाटर",    category: "vegetables", emoji: "🍅", calories_100g: 18,  protein_100g: 0.9, fat_100g: 0.2, carbs_100g:  4,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "potato",      name: "Potato",        nameHi: "आलू",      category: "vegetables", emoji: "🥔", calories_100g: 77,  protein_100g: 2.0, fat_100g: 0.1, carbs_100g: 17,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "onion",       name: "Onion",         nameHi: "प्याज़",   category: "vegetables", emoji: "🧅", calories_100g: 40,  protein_100g: 1.1, fat_100g: 0.1, carbs_100g:  9,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "carrot",      name: "Carrot",        nameHi: "गाजर",     category: "vegetables", emoji: "🥕", calories_100g: 41,  protein_100g: 0.9, fat_100g: 0.2, carbs_100g: 10,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "capsicum",    name: "Bell Pepper",   nameHi: "शिमला मिर्च", category: "vegetables", emoji: "🫑", calories_100g: 31,  protein_100g: 1.0, fat_100g: 0.3, carbs_100g:  6, defaultQuantity: 150, defaultUnit: "g" },
  { id: "brinjal",     name: "Brinjal",       nameHi: "बैंगन",    category: "vegetables", emoji: "🍆", calories_100g: 25,  protein_100g: 1.0, fat_100g: 0.2, carbs_100g:  6,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "cauliflower", name: "Cauliflower",   nameHi: "फूलगोभी",  category: "vegetables", emoji: "🥦", calories_100g: 25,  protein_100g: 1.9, fat_100g: 0.3, carbs_100g:  5,  defaultQuantity: 300, defaultUnit: "g" },
  { id: "cabbage",     name: "Cabbage",       nameHi: "पत्तागोभी", category: "vegetables", emoji: "🥬", calories_100g: 25, protein_100g: 1.3, fat_100g: 0.1, carbs_100g:  6,  defaultQuantity: 400, defaultUnit: "g" },
  { id: "spinach",     name: "Spinach",       nameHi: "पालक",     category: "vegetables", emoji: "🥬", calories_100g: 23,  protein_100g: 2.9, fat_100g: 0.4, carbs_100g:  4,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "peas",        name: "Green Peas",    nameHi: "मटर",      category: "vegetables", emoji: "🫛", calories_100g: 81,  protein_100g: 5.4, fat_100g: 0.4, carbs_100g: 14,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "cucumber",    name: "Cucumber",      nameHi: "खीरा",     category: "vegetables", emoji: "🥒", calories_100g: 15,  protein_100g: 0.7, fat_100g: 0.1, carbs_100g:  4,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "okra",        name: "Okra (Bhindi)", nameHi: "भिंडी",   category: "vegetables", emoji: "🌿", calories_100g: 33,  protein_100g: 1.9, fat_100g: 0.2, carbs_100g:  7,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "bitter_gourd",name: "Bitter Gourd",  nameHi: "करेला",    category: "vegetables", emoji: "🥬", calories_100g: 17,  protein_100g: 1.0, fat_100g: 0.2, carbs_100g:  3,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "bottle_gourd",name: "Bottle Gourd",  nameHi: "लौकी",    category: "vegetables", emoji: "🍵", calories_100g: 15,  protein_100g: 0.6, fat_100g: 0.1, carbs_100g:  3,  defaultQuantity: 300, defaultUnit: "g" },
  { id: "radish",      name: "Radish",        nameHi: "मूली",     category: "vegetables", emoji: "🌱", calories_100g: 16,  protein_100g: 0.7, fat_100g: 0.1, carbs_100g:  3,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "green_chilli",name: "Green Chilli",  nameHi: "हरी मिर्च", category: "vegetables", emoji: "🌶️", calories_100g: 40,  protein_100g: 2.0, fat_100g: 0.4, carbs_100g:  9, defaultQuantity: 50,  defaultUnit: "g" },
  { id: "ginger",      name: "Ginger",        nameHi: "अदरक",     category: "vegetables", emoji: "🫚", calories_100g: 80,  protein_100g: 1.8, fat_100g: 0.8, carbs_100g: 18,  defaultQuantity: 50,  defaultUnit: "g" },
  { id: "garlic",      name: "Garlic",        nameHi: "लहसुन",    category: "vegetables", emoji: "🧄", calories_100g: 149, protein_100g: 6.4, fat_100g: 0.5, carbs_100g: 33,  defaultQuantity: 50,  defaultUnit: "g" },
  { id: "beetroot",    name: "Beetroot",      nameHi: "चुकंदर",   category: "vegetables", emoji: "🟣", calories_100g: 43,  protein_100g: 1.6, fat_100g: 0.2, carbs_100g: 10,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "sweet_potato",name: "Sweet Potato",  nameHi: "शकरकंद",  category: "vegetables", emoji: "🍠", calories_100g: 86,  protein_100g: 1.6, fat_100g: 0.1, carbs_100g: 20,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "corn",        name: "Corn",          nameHi: "मक्का",    category: "vegetables", emoji: "🌽", calories_100g: 86,  protein_100g: 3.3, fat_100g: 1.4, carbs_100g: 19,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "mushroom",    name: "Mushroom",      nameHi: "मशरूम",    category: "vegetables", emoji: "🍄", calories_100g: 22,  protein_100g: 3.1, fat_100g: 0.3, carbs_100g:  3,  defaultQuantity: 150, defaultUnit: "g" },
  { id: "broccoli",    name: "Broccoli",      nameHi: "ब्रोकली",  category: "vegetables", emoji: "🥦", calories_100g: 34,  protein_100g: 2.8, fat_100g: 0.4, carbs_100g:  7,  defaultQuantity: 200, defaultUnit: "g" },
  { id: "lettuce",     name: "Lettuce",       nameHi: "सलाद पत्ता", category: "vegetables", emoji: "🥬", calories_100g: 15, protein_100g: 1.4, fat_100g: 0.2, carbs_100g:  3, defaultQuantity: 150, defaultUnit: "g" },

  // ─── Herbs ───────────────────────────────────────────────────────────────────
  { id: "coriander",   name: "Coriander",     nameHi: "धनिया",    category: "herbs",      emoji: "🌿", calories_100g: 23,  protein_100g: 2.1, fat_100g: 0.5, carbs_100g:  4,  defaultQuantity: 50,  defaultUnit: "g" },
  { id: "mint",        name: "Mint",          nameHi: "पुदीना",   category: "herbs",      emoji: "🌱", calories_100g: 70,  protein_100g: 3.8, fat_100g: 0.9, carbs_100g: 15,  defaultQuantity: 30,  defaultUnit: "g" },
  { id: "curry_leaves",name: "Curry Leaves",  nameHi: "करी पत्ता", category: "herbs",     emoji: "🍃", calories_100g: 108, protein_100g: 6.1, fat_100g: 1.0, carbs_100g: 19,  defaultQuantity: 20,  defaultUnit: "g" },
  { id: "fenugreek",   name: "Fenugreek",     nameHi: "मेथी",     category: "herbs",      emoji: "🌿", calories_100g: 323, protein_100g:23.0, fat_100g: 6.4, carbs_100g: 58,  defaultQuantity: 30,  defaultUnit: "g" },
  { id: "tulsi",       name: "Tulsi / Basil", nameHi: "तुलसी",    category: "herbs",      emoji: "🌱", calories_100g: 23,  protein_100g: 3.2, fat_100g: 0.6, carbs_100g:  3,  defaultQuantity: 20,  defaultUnit: "g" },

  // ─── Nuts & Seeds ─────────────────────────────────────────────────────────────
  { id: "peanut",      name: "Peanuts",       nameHi: "मूंगफली",  category: "nuts_seeds", emoji: "🥜", calories_100g: 567, protein_100g:25.8, fat_100g:49.2, carbs_100g: 16,  defaultQuantity: 50,  defaultUnit: "g" },
  { id: "cashew",      name: "Cashew",        nameHi: "काजू",     category: "nuts_seeds", emoji: "🥜", calories_100g: 553, protein_100g:18.2, fat_100g:43.8, carbs_100g: 30,  defaultQuantity: 30,  defaultUnit: "g" },
  { id: "almond",      name: "Almond",        nameHi: "बादाम",    category: "nuts_seeds", emoji: "🥜", calories_100g: 579, protein_100g:21.2, fat_100g:49.9, carbs_100g: 22,  defaultQuantity: 30,  defaultUnit: "g" },
  { id: "walnut",      name: "Walnut",        nameHi: "अखरोट",    category: "nuts_seeds", emoji: "🥜", calories_100g: 654, protein_100g:15.2, fat_100g:65.2, carbs_100g: 14,  defaultQuantity: 30,  defaultUnit: "g" },
  { id: "pistachio",   name: "Pistachio",     nameHi: "पिस्ता",   category: "nuts_seeds", emoji: "🥜", calories_100g: 562, protein_100g:20.2, fat_100g:45.3, carbs_100g: 28,  defaultQuantity: 30,  defaultUnit: "g" },
  { id: "sesame",      name: "Sesame Seeds",  nameHi: "तिल",      category: "nuts_seeds", emoji: "⚪", calories_100g: 573, protein_100g:17.7, fat_100g:49.7, carbs_100g: 23,  defaultQuantity: 20,  defaultUnit: "g" },
  { id: "flaxseed",    name: "Flax Seeds",    nameHi: "अलसी",     category: "nuts_seeds", emoji: "🌾", calories_100g: 534, protein_100g:18.3, fat_100g:42.2, carbs_100g: 29,  defaultQuantity: 15,  defaultUnit: "g" },
];

// Category labels for display
export const PRODUCE_CATEGORY_LABELS: Record<ProduceItem["category"], string> = {
  fruits: "Fruits 🍎",
  vegetables: "Vegetables 🥦",
  herbs: "Herbs 🌿",
  nuts_seeds: "Nuts & Seeds 🥜",
};

// Search across name + nameHi
export function searchProduce(query: string): ProduceItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return PRODUCE_LIBRARY;
  return PRODUCE_LIBRARY.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.nameHi ?? "").includes(q) ||
      p.id.includes(q)
  );
}
