-- Add all columns required by the nutrition/consumed API route
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 1.0;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS detection_type TEXT DEFAULT 'manual';
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'detected';
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS nutritional_data JSONB DEFAULT '{}'::jsonb;
