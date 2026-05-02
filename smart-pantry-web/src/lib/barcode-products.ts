/**
 * barcode-products.ts
 *
 * Hardcoded Indian grocery barcode dictionary.
 * Zero API calls — instant local lookups.
 *
 * ~30 common Indian grocery products across 7 categories.
 * Unknown barcodes fall through to manual form entry.
 *
 * Barcodes are approximate/representative EAN-13 values used on
 * Indian retail packaging. Not guaranteed to match every batch/SKU.
 */

export interface BarcodeProduct {
  name: string;
  brand: string;
  category: string;
  serving: string;
}

/**
 * Lookup helper — returns null if barcode not in local database.
 */
export function lookupLocalBarcode(barcode: string): BarcodeProduct | null {
  return BARCODE_PRODUCTS[barcode] ?? null;
}

/**
 * Static dictionary of ~30 Indian grocery products.
 * Keys are normalized EAN-13 / UPC-A barcode strings.
 */
export const BARCODE_PRODUCTS: Record<string, BarcodeProduct> = {
  // ─── DAIRY ──────────────────────────────────────────────────────────────
  "8901012000012": {
    name: "Amul Butter",
    brand: "Amul",
    category: "Dairy",
    serving: "100g",
  },
  "8901012001026": {
    name: "Amul Gold Milk",
    brand: "Amul",
    category: "Dairy",
    serving: "500ml",
  },
  "8901012001033": {
    name: "Amul Calci Plus Milk",
    brand: "Amul",
    category: "Dairy",
    serving: "200ml",
  },
  "8901012001040": {
    name: "Amul Taaza Toned Milk",
    brand: "Amul",
    category: "Dairy",
    serving: "500ml",
  },
  "8901012005017": {
    name: "Mother Dairy Dahi",
    brand: "Mother Dairy",
    category: "Dairy",
    serving: "400g",
  },
  "8901012002016": {
    name: "Amul Masti Dahi",
    brand: "Amul",
    category: "Dairy",
    serving: "400g",
  },
  "8901012003013": {
    name: "Amul Cheese Slices",
    brand: "Amul",
    category: "Dairy",
    serving: "200g (10 slices)",
  },

  // ─── BISCUITS ────────────────────────────────────────────────────────────
  "8901719100016": {
    name: "Parle-G Original Glucose Biscuits",
    brand: "Parle",
    category: "Biscuits",
    serving: "80g",
  },
  "8901063020016": {
    name: "Britannia Good Day Butter Cookies",
    brand: "Britannia",
    category: "Biscuits",
    serving: "75g",
  },
  "8901719110015": {
    name: "Parle Hide & Seek Chocolate Chip Cookies",
    brand: "Parle",
    category: "Biscuits",
    serving: "100g",
  },
  "8901725166021": {
    name: "Sunfeast Dark Fantasy Choco Fills",
    brand: "ITC Sunfeast",
    category: "Biscuits",
    serving: "75g",
  },
  "8901063140011": {
    name: "Britannia Marie Gold",
    brand: "Britannia",
    category: "Biscuits",
    serving: "250g",
  },
  "8901719120014": {
    name: "Parle Monaco Salted Crackers",
    brand: "Parle",
    category: "Biscuits",
    serving: "150g",
  },

  // ─── NAMKEENS / SNACKS ───────────────────────────────────────────────────
  "8901491100015": {
    name: "Haldiram's Aloo Bhujia",
    brand: "Haldiram's",
    category: "Snacks",
    serving: "150g",
  },
  "8901491200012": {
    name: "Haldiram's Moong Dal",
    brand: "Haldiram's",
    category: "Snacks",
    serving: "150g",
  },
  "8908002040010": {
    name: "Bikaji Bhujia",
    brand: "Bikaji",
    category: "Snacks",
    serving: "200g",
  },
  "8906002530017": {
    name: "Balaji Wafers Masala",
    brand: "Balaji",
    category: "Snacks",
    serving: "60g",
  },

  // ─── INSTANT FOOD ────────────────────────────────────────────────────────
  "8901030870018": {
    name: "Maggi 2-Minute Noodles Masala",
    brand: "Maggi",
    category: "Instant Food",
    serving: "70g",
  },
  "8901030860019": {
    name: "Maggi Masala Noodles",
    brand: "Maggi",
    category: "Instant Food",
    serving: "70g",
  },
  "8901058852017": {
    name: "Top Ramen Curry Noodles",
    brand: "Nissin",
    category: "Instant Food",
    serving: "75g",
  },
  "8901314100015": {
    name: "Knorr Soupy Noodles Tomato",
    brand: "Knorr",
    category: "Instant Food",
    serving: "65g",
  },

  // ─── BEVERAGES / TETRA PACKS ─────────────────────────────────────────────
  "8906046530011": {
    name: "Real Fruit Power Mixed Fruit Juice",
    brand: "Dabur Real",
    category: "Beverages",
    serving: "200ml",
  },
  "8901057500011": {
    name: "Tropicana Orange 100% Juice",
    brand: "Tropicana",
    category: "Beverages",
    serving: "200ml",
  },
  "8901063010017": {
    name: "Frooti Mango Drink",
    brand: "Parle Agro",
    category: "Beverages",
    serving: "200ml",
  },
  "8906082100011": {
    name: "Paper Boat Aamras",
    brand: "Paper Boat",
    category: "Beverages",
    serving: "200ml",
  },

  // ─── STAPLES ─────────────────────────────────────────────────────────────
  "8901580000015": {
    name: "Tata Salt",
    brand: "Tata",
    category: "Staples",
    serving: "1kg",
  },
  "8901497000011": {
    name: "Fortune Sunflower Refined Oil",
    brand: "Fortune",
    category: "Staples",
    serving: "1L",
  },
  "8901014000019": {
    name: "Aashirvaad Whole Wheat Atta",
    brand: "Aashirvaad",
    category: "Staples",
    serving: "5kg",
  },
  "8901041000010": {
    name: "India Gate Basmati Rice Classic",
    brand: "India Gate",
    category: "Staples",
    serving: "1kg",
  },

  // ─── CONDIMENTS / SPICES ─────────────────────────────────────────────────
  "8906004200016": {
    name: "MDH Chana Masala",
    brand: "MDH",
    category: "Spices",
    serving: "100g",
  },
  "8906001600011": {
    name: "Everest Garam Masala",
    brand: "Everest",
    category: "Spices",
    serving: "50g",
  },
  "8901063060013": {
    name: "Kissan Tomato Ketchup",
    brand: "Kissan",
    category: "Condiments",
    serving: "500g",
  },
};
