import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";

const USER_AGENT = "SmartPantryApp/2.0 (contact: pantry-app)";
const FETCH_MS = 7000;

type CachedShape = {
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
  | "upcitemdb";

function normalizeBarcode(raw: string): string {
  let n = raw.replace(/^[A-Za-z]+-/i, "").replace(/-/g, "");
  return n || raw;
}

function lookupCandidates(raw: string): string[] {
  const normalized = normalizeBarcode(raw);
  const digits = normalized.replace(/\D/g, "");
  const out: string[] = [];
  const push = (s: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  push(normalized);
  if (digits) {
    push(digits);
    if (digits.length < 12) push(digits.padStart(12, "0"));
    if (digits.length < 13) push(digits.padStart(13, "0"));
  }
  return out;
}

async function fetchJson(url: string): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function mapOffCategory(tags: unknown): string {
  if (!tags || !Array.isArray(tags)) return "other";
  const tagStr = tags.join(" ").toLowerCase();
  if (tagStr.includes("dairy") || tagStr.includes("milk") || tagStr.includes("cheese")) return "dairy";
  if (tagStr.includes("snack") || tagStr.includes("biscuit") || tagStr.includes("chips")) return "snacks";
  if (tagStr.includes("beverage") || tagStr.includes("drink")) return "beverages";
  if (tagStr.includes("fruit")) return "fruits";
  if (tagStr.includes("vegetable")) return "vegetables";
  if (tagStr.includes("meat") || tagStr.includes("poultry")) return "meat_poultry";
  return "other";
}

function parseOpenFoodFactsLike(
  data: unknown,
  barcode: string,
  source: RemoteLookupSource
): CachedShape | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { status?: number; product?: Record<string, unknown> };
  if (d.status !== 1 || !d.product) return null;
  const p = d.product;
  const name =
    (p.product_name as string) ||
    (p.product_name_en as string) ||
    (p.generic_name as string) ||
    "";
  if (!name.trim()) return null;
  const nut = (p.nutriments as Record<string, number>) || {};
  return {
    barcode,
    product_name: name.trim(),
    brand: (p.brands as string) || "",
    category:
      typeof p.categories === "string"
        ? p.categories
        : mapOffCategory(p.categories_tags),
    calories: nut["energy-kcal_100g"] ?? 0,
    protein: nut.proteins_100g ?? 0,
    fat: nut.fat_100g ?? 0,
    carbs: nut.carbohydrates_100g ?? 0,
    image_url:
      (p.image_front_url as string) || (p.image_url as string) || "",
    serving_size: (p.serving_size as string) || "",
    source,
  };
}

async function tryOpenFoodFacts(barcode: string, host: string, source: RemoteLookupSource) {
  const data = await fetchJson(`${host}/api/v2/product/${encodeURIComponent(barcode)}.json`);
  return parseOpenFoodFactsLike(data, barcode, source);
}

async function tryUpcItemDb(barcode: string): Promise<CachedShape | null> {
  const data = await fetchJson(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`
  );
  if (!data || typeof data !== "object") return null;
  const items = (data as { items?: Array<Record<string, unknown>> }).items;
  if (!items?.length) return null;
  const item = items[0];
  const title = (item.title as string)?.trim();
  if (!title) return null;
  const images = item.images as string[] | undefined;
  return {
    barcode,
    product_name: title,
    brand: (item.brand as string) || "",
    category: (item.category as string) || "other",
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    image_url: images?.[0] || "",
    serving_size: "",
    source: "upcitemdb",
  };
}

async function lookupOneBarcode(barcode: string): Promise<{ product: CachedShape; source: RemoteLookupSource } | null> {
  const [world, india, opf, obf, upc] = await Promise.all([
    tryOpenFoodFacts(barcode, "https://world.openfoodfacts.org", "openfoodfacts"),
    tryOpenFoodFacts(barcode, "https://in.openfoodfacts.org", "openfoodfacts_in"),
    tryOpenFoodFacts(barcode, "https://world.openproductsfacts.org", "openproductsfacts"),
    tryOpenFoodFacts(barcode, "https://world.openbeautyfacts.org", "openbeautyfacts"),
    tryUpcItemDb(barcode),
  ]);

  const hits: Array<{ product: CachedShape; source: RemoteLookupSource }> = [];
  if (world) hits.push({ product: world, source: "openfoodfacts" });
  if (india) hits.push({ product: india, source: "openfoodfacts_in" });
  if (opf) hits.push({ product: opf, source: "openproductsfacts" });
  if (obf) hits.push({ product: obf, source: "openbeautyfacts" });
  if (upc) hits.push({ product: upc, source: "upcitemdb" });

  if (!hits.length) return null;
  const priority: RemoteLookupSource[] = [
    "openfoodfacts_in",
    "openfoodfacts",
    "openproductsfacts",
    "upcitemdb",
    "openbeautyfacts",
  ];
  hits.sort((a, b) => priority.indexOf(a.source) - priority.indexOf(b.source));
  return hits[0];
}

/**
 * GET /api/barcode-lookup?code=...
 * Server-side lookup with timeouts and multiple DBs (avoids browser CORS on UPC ItemDB).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const candidates = lookupCandidates(code);
  for (const cand of candidates) {
    const hit = await lookupOneBarcode(cand);
    if (hit) {
      return NextResponse.json({
        product: hit.product,
        source: hit.source,
      });
    }
  }

  return NextResponse.json({ product: null, source: "not_found" as const });
}
