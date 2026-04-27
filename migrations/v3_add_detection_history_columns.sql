ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS storage_type TEXT;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS expiry_date TEXT;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS barcode_data TEXT;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS product_image_url TEXT;
