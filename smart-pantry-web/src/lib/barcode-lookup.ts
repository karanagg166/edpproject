/**
 * barcode-lookup.ts
 *
 * Client-side waterfall for resolving barcodes in the web app:
 *   1. Supabase barcode_cache  (same table Python writes to after scans)
 *   2. Open Food Facts API     (free, no key, ~600k products)
 *   3. null                    (show manual entry form)
 *
 * On an OFF hit the result is saved to barcode_cache so subsequent
 * scans of the same product are instant — community database grows
 * with every web scan too.
 */

import { createSupabaseBrowser } from "@/lib/supabase-browser";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
export type CachedProduct = {
  barcode: string;
  product_name: string;
  brand?: string;
  category?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  image_url?: string;
  serving_size?: string;
  source?: string;
};

export type LookupResult =
  | { product: CachedProduct; source: "local" | "openfoodfacts" }
  | { product: null; source: "not_found" };

// -------------------------------------------------------------------------
// Barcode normalization
// Mirrors normalize_barcode() in barcode_scanner.py
// -------------------------------------------------------------------------

/**
 * Strip Indian brand prefixes and dashes before sending to Open Food Facts.
 *   IVM-1487-209320  →  1487209320
 *   MRP-500-012345   →  500012345
 *   5000112548167    →  5000112548167  (unchanged)
 */
export function normalizeBarcode(raw: string): string {
  // Strip leading alphabetic prefix followed by a dash (e.g. "IVM-", "MRP-")
  let normalized = raw.replace(/^[A-Za-z]+-/i, "");
  // Remove remaining dashes
  normalized = normalized.replace(/-/g, "");
  return normalized || raw;
}

// -------------------------------------------------------------------------
// Step 1 — check Supabase barcode_cache
// -------------------------------------------------------------------------
async function checkLocalCache(barcode: string): Promise<CachedProduct | null> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from("barcode_cache")
    .select("*")
    .eq("barcode", barcode)
    .single();

  if (error || !data) return null;
  return data as CachedProduct;
}

// -------------------------------------------------------------------------
// Step 2 — query Open Food Facts
// -------------------------------------------------------------------------
async function checkOpenFoodFacts(barcode: string): Promise<CachedProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: { "User-Agent": "SmartPantryApp/2.0 (student@example.com)" },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1) return null;

    const p = data.product ?? {};
    const productName: string =
      p.product_name || p.product_name_en || p.generic_name || "";
    if (!productName) return null;

    return {
      barcode,
      product_name: productName,
      brand: p.brands ?? "",
      category: p.categories ?? "",
      calories: p.nutriments?.["energy-kcal_100g"] ?? 0,
      protein: p.nutriments?.proteins_100g ?? 0,
      fat: p.nutriments?.fat_100g ?? 0,
      carbs: p.nutriments?.carbohydrates_100g ?? 0,
      image_url: p.image_front_url ?? p.image_url ?? "",
      serving_size: p.serving_size ?? "",
      source: "openfoodfacts",
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------------
// Step 3 — save result to Supabase barcode_cache
// -------------------------------------------------------------------------
export async function saveToCache(product: CachedProduct): Promise<void> {
  const supabase = createSupabaseBrowser();
  await supabase
    .from("barcode_cache")
    .upsert(
      { ...product, updated_at: new Date().toISOString() },
      { onConflict: "barcode" }
    );
}

// -------------------------------------------------------------------------
// Main entry point — waterfall lookup
// -------------------------------------------------------------------------
export async function lookupBarcodeWeb(raw: string): Promise<LookupResult> {
  const barcode = normalizeBarcode(raw);

  // Step 1: local Supabase cache (written by both Python and web scans)
  const local = await checkLocalCache(barcode);
  if (local) return { product: local, source: "local" };

  // Step 2: Open Food Facts
  const off = await checkOpenFoodFacts(barcode);
  if (off) {
    // Cache it so the next scan is instant (no await — fire and forget)
    saveToCache(off);
    return { product: off, source: "openfoodfacts" };
  }

  return { product: null, source: "not_found" };
}
