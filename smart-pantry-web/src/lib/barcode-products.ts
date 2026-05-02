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
  "8901262010016": {
    name: "Amul Butter",
    brand: "Amul",
    category: "Dairy",
    serving: "100g",
  },
  "8901262150200": {
    name: "Amul Gold Milk",
    brand: "Amul",
    category: "Dairy",
    serving: "500ml",
  },
  "8901262150217": {
    name: "Amul Taaza Toned Milk",
    brand: "Amul",
    category: "Dairy",
    serving: "500ml",
  },
  "8901262200622": {
    name: "Amul Masti Dahi",
    brand: "Amul",
    category: "Dairy",
    serving: "400g",
  },
  "8901262020015": {
    name: "Amul Cheese Slices",
    brand: "Amul",
    category: "Dairy",
    serving: "200g (10 slices)",
  },
  "8901648097983": {
    name: "Mother Dairy Dahi",
    brand: "Mother Dairy",
    category: "Dairy",
    serving: "400g",
  },
  "8901262150521": {
    name: "Amul Fresh Cream",
    brand: "Amul",
    category: "Dairy",
    serving: "200ml",
  },
  "8901058842142": {
    name: "Nestle A+ Slim Milk",
    brand: "Nestle",
    category: "Dairy",
    serving: "500ml",
  },
  "8901063127362": {
    name: "Britannia Cheese Cubes",
    brand: "Britannia",
    category: "Dairy",
    serving: "200g",
  },
  "8906042890013": {
    name: "Yakult Probiotic Drink",
    brand: "Yakult",
    category: "Dairy",
    serving: "65ml",
  },
  "8901262180115": {
    name: "Amul Paneer",
    brand: "Amul",
    category: "Dairy",
    serving: "200g",
  },
  "8901648013761": {
    name: "Mother Dairy Mishti Doi",
    brand: "Mother Dairy",
    category: "Dairy",
    serving: "85g",
  },
  "8901058100600": {
    name: "Nestlé Milkmaid",
    brand: "Nestle",
    category: "Dairy",
    serving: "400g",
  },
  "8901262060028": {
    name: "Amul Butter Garlic Cheese Spread",
    brand: "Amul",
    category: "Dairy",
    serving: "200g",
  },

  // ─── BEVERAGES / TETRA PACKS ─────────────────────────────────────────────
  "8901262151313": {
    name: "Amul Kool Chocolate Milk",
    brand: "Amul",
    category: "Beverages",
    serving: "200ml",
  },
  "8901262151641": {
    name: "Amul Lassi Mango",
    brand: "Amul",
    category: "Beverages",
    serving: "200ml",
  },
  "8901888005496": {
    name: "Real Fruit Power Mixed Fruit",
    brand: "Dabur Real",
    category: "Beverages",
    serving: "200ml",
  },
  "8902080011025": {
    name: "Tropicana Orange 100% Juice",
    brand: "Tropicana",
    category: "Beverages",
    serving: "200ml",
  },
  "8902579100025": {
    name: "Frooti Mango Drink",
    brand: "Parle Agro",
    category: "Beverages",
    serving: "200ml",
  },
  "8908001705448": {
    name: "Paper Boat Aamras",
    brand: "Paper Boat",
    category: "Beverages",
    serving: "200ml",
  },
  "8902080013395": {
    name: "Tropicana Mixed Fruit Delight",
    brand: "Tropicana",
    category: "Beverages",
    serving: "1L",
  },

  // ─── CONDIMENTS ──────────────────────────────────────────────────────────
  "8901030532719": {
    name: "Kissan Tomato Ketchup",
    brand: "Kissan",
    category: "Condiments",
    serving: "500g",
  },
  "8901071211307": {
    name: "Hershey's Chocolate Syrup",
    brand: "Hershey's",
    category: "Condiments",
    serving: "200g",
  },
  "8901058013658": {
    name: "Maggi Hot & Sweet Sauce",
    brand: "Maggi",
    category: "Condiments",
    serving: "500g",
  },
  "8901246006356": {
    name: "Del Monte Olive Oil Mayo",
    brand: "Del Monte",
    category: "Condiments",
    serving: "270g",
  },
};
