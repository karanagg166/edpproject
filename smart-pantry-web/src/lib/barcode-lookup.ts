/**
 * barcode-lookup.ts
 *
 * Simplified local-only barcode resolution.
 * No network calls — looks up BARCODE_PRODUCTS (hardcoded Indian grocery map).
 *
 * Flow:
 *   1. normalizeBarcode(raw)
 *   2. lookupLocalBarcode(barcode)   ← instant, no network
 *   3. found? return CachedProduct with source "hardcoded"
 *   4. not found? return { product: null, source: "not_found" }
 *
 * saveToCache() is kept for manual entries (upsert to Supabase barcode_cache).
 */

import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { lookupLocalBarcode } from "@/lib/barcode-products";

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

export type RemoteLookupSource =
  | "openfoodfacts"
  | "openfoodfacts_in"
  | "openproductsfacts"
  | "openbeautyfacts"
  | "upcitemdb"
  | "fatsecret";

export type LookupSource = "local" | "produce_library" | "hardcoded" | RemoteLookupSource;

export type LookupResult =
  | { product: CachedProduct; source: LookupSource }
  | { product: null; source: "not_found" };

export const LOOKUP_SOURCE_LABELS: Record<LookupSource, string> = {
  local: "your cache",
  produce_library: "Produce Library",
  hardcoded: "Local Database",
  openfoodfacts: "Open Food Facts",
  openfoodfacts_in: "Open Food Facts (India)",
  openproductsfacts: "Open Products Facts",
  openbeautyfacts: "Open Beauty Facts",
  upcitemdb: "UPC Item DB",
  fatsecret: "FatSecret",
};

// -------------------------------------------------------------------------
// Barcode normalization
// Mirrors normalize_barcode() in barcode_scanner.py
// -------------------------------------------------------------------------

export function normalizeBarcode(raw: string): string {
  let b = raw.trim();

  // Strip Indian distributor prefixes like IVM-1487-209320 or MRP-12345
  b = b.replace(/^[A-Z]{1,4}[-_]/i, "");

  // Remove all dashes and spaces
  b = b.replace(/[-\s]/g, "");

  // Strip leading zeros only if > 13 digits (accidentally padded)
  if (b.length > 13) b = b.replace(/^0+/, "");

  // GTIN-8 (EAN-8): valid as-is
  if (b.length === 8) return b;

  // UPC-A (12 digits): valid as-is, FatSecret will pad to GTIN-13
  if (b.length === 12) return b;

  // EAN-13: valid as-is
  if (b.length === 13) return b;

  // 14-digit with leading zero — some Indian scanners prepend country code twice
  if (b.length === 14 && b.startsWith("0")) return b.slice(1);

  return b;
}

// -------------------------------------------------------------------------
// Main entry point — instant local lookup
// -------------------------------------------------------------------------
export async function lookupBarcodeWeb(raw: string): Promise<LookupResult> {
  const barcode = normalizeBarcode(raw);

  const found = lookupLocalBarcode(barcode);
  if (found) {
    return {
      product: {
        barcode,
        product_name: found.name,
        brand: found.brand,
        category: found.category,
        serving_size: found.serving,
        source: "hardcoded",
      },
      source: "hardcoded",
    };
  }

  return { product: null, source: "not_found" };
}

// -------------------------------------------------------------------------
// Save manually entered product to Supabase barcode_cache
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
