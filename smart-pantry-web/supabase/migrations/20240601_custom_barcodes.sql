-- Migration: custom_barcodes table
-- Run: pnpm supabase db push  OR  paste into Supabase SQL editor

CREATE TABLE IF NOT EXISTS custom_barcodes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode     text NOT NULL,
  product_name text NOT NULL,
  brand       text,
  category    text,
  calories    numeric,
  protein     numeric,
  fat         numeric,
  carbs       numeric,
  serving_size text,
  image_url   text,
  notes       text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,

  -- Each user can only have one entry per barcode
  UNIQUE (user_id, barcode)
);

-- Index for fast per-user barcode lookups
CREATE INDEX IF NOT EXISTS idx_custom_barcodes_user_barcode
  ON custom_barcodes (user_id, barcode);

-- RLS: users see and modify only their own rows
ALTER TABLE custom_barcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_barcodes_user_select"
  ON custom_barcodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "custom_barcodes_user_insert"
  ON custom_barcodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_barcodes_user_update"
  ON custom_barcodes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_barcodes_user_delete"
  ON custom_barcodes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER custom_barcodes_updated_at
  BEFORE UPDATE ON custom_barcodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
