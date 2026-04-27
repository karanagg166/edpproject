-- barcode_cache: community-built product database
-- Written by Python (detector.py via cache_barcode) after API lookups.
-- Read by both Python and the web dashboard for instant barcode resolution.

CREATE TABLE IF NOT EXISTS public.barcode_cache (
  barcode        TEXT PRIMARY KEY,
  raw_barcode    TEXT,
  product_name   TEXT NOT NULL,
  brand          TEXT,
  category       TEXT,
  calories       NUMERIC DEFAULT 0,
  protein        NUMERIC DEFAULT 0,
  fat            NUMERIC DEFAULT 0,
  carbs          NUMERIC DEFAULT 0,
  image_url      TEXT,
  serving_size   TEXT,
  source         TEXT DEFAULT 'openfoodfacts',   -- 'openfoodfacts' | 'upcitemdb' | 'manual'
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by barcode string
CREATE UNIQUE INDEX IF NOT EXISTS barcode_cache_barcode_idx ON public.barcode_cache (barcode);

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION public.set_barcode_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_barcode_cache_updated_at ON public.barcode_cache;
CREATE TRIGGER trg_barcode_cache_updated_at
  BEFORE UPDATE ON public.barcode_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_barcode_cache_updated_at();
