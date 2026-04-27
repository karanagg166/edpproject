/**
 * barcode-lookup.ts
 *
 * Client-side waterfall for resolving barcodes:
 *   1. Supabase barcode_cache
 *   2. GET /api/barcode-lookup — server timeouts + parallel DBs (OFF world/IN,
 *      Open Products Facts, Open Beauty Facts, UPC ItemDB) to avoid CORS and hangs
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

export type RemoteLookupSource =
  | "openfoodfacts"
  | "openfoodfacts_in"
  | "openproductsfacts"
  | "openbeautyfacts"
  | "upcitemdb"
  | "fatsecret";

export type LookupSource = "local" | "produce_library" | RemoteLookupSource;

export type LookupResult =
  | { product: CachedProduct; source: LookupSource }
  | { product: null; source: "not_found" };

export const LOOKUP_SOURCE_LABELS: Record<LookupSource, string> = {
  local: "your cache",
  produce_library: "Produce Library",
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

const REMOTE_LOOKUP_TIMEOUT_MS = 22_000;

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

  const local = await checkLocalCache(barcode);
  if (local) return { product: local, source: "local" };

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), REMOTE_LOOKUP_TIMEOUT_MS);

  try {
    const res = await fetch(
      `/api/barcode-lookup?code=${encodeURIComponent(raw)}`,
      { credentials: "include", signal: ctrl.signal }
    );

    if (res.status === 401) {
      return { product: null, source: "not_found" };
    }
    if (!res.ok) {
      return { product: null, source: "not_found" };
    }

    const data = (await res.json()) as {
      product?: CachedProduct;
      source?: RemoteLookupSource | "not_found";
    };

    if (data.product && data.source && data.source !== "not_found") {
      saveToCache(data.product);
      return { product: data.product, source: data.source };
    }
  } catch {
    // Network, timeout, or abort
  } finally {
    clearTimeout(timeoutId);
  }

  return { product: null, source: "not_found" };
}
