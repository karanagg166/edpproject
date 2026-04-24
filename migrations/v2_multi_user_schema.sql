-- Smart Pantry — Database Migration v2 (Fixed for Supabase CLI)
-- Handles missing tables gracefully

-- 1. Add user_id to pantry
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'user_1';

-- 2. Create waste_log if it doesn't exist, then add user_id
CREATE TABLE IF NOT EXISTS waste_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT,
  reason TEXT,
  wasted_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE waste_log ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'user_1';

-- 3. Rename detections → detection_history
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'detections') 
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'detection_history') THEN
    ALTER TABLE detections RENAME TO detection_history;
  END IF;
END $$;

-- 4. Create detection_history if it doesn't exist (for fresh installs)
CREATE TABLE IF NOT EXISTS detection_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT,
  confidence NUMERIC,
  detection_type TEXT,
  barcode TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'user_1';
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'added';

-- 5. Add nutrition columns to pantry
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS calories_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS protein_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS fat_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS carbs_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS fiber_per_100g NUMERIC DEFAULT 0;

-- 6. Sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  temperature NUMERIC,
  humidity NUMERIC,
  weight_grams NUMERIC,
  sensor_type TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Diet plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_weight NUMERIC,
  target_weight NUMERIC,
  timeline_weeks INTEGER,
  goal TEXT,
  plan_content TEXT,
  pantry_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Health scores
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER,
  protein_score INTEGER,
  carb_score INTEGER,
  fat_score INTEGER,
  micro_score INTEGER,
  feedback TEXT,
  analysis JSONB,
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (id, display_name) VALUES
  ('user_1', 'Karan'),
  ('user_2', 'Test User 2'),
  ('user_3', 'Test User 3')
ON CONFLICT (id) DO NOTHING;

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_expiry ON pantry(expiry_date);
CREATE INDEX IF NOT EXISTS idx_detection_user ON detection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_action ON detection_history(action);
CREATE INDEX IF NOT EXISTS idx_sensor_user ON sensor_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_health_user ON health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_user ON diet_plans(user_id);

-- 11. Enable Realtime (ignore errors if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE detection_history;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE health_scores;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT 'Migration complete ✅' AS status;
