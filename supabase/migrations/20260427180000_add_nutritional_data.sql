ALTER TABLE detection_history
ADD COLUMN IF NOT EXISTS nutritional_data JSONB DEFAULT '{}'::jsonb;
