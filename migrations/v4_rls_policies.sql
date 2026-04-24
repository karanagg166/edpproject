-- Smart Pantry — RLS Policies Migration
-- Secures user data so users can only see and modify their own records

-- Enable RLS on all tables
ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_log ENABLE ROW LEVEL SECURITY;

-- Pantry policies
DROP POLICY IF EXISTS "Users see own pantry" ON pantry;
CREATE POLICY "Users see own pantry" ON pantry
  FOR ALL USING (user_id = auth.uid()::text);

-- Detection history policies
DROP POLICY IF EXISTS "Users see own history" ON detection_history;
CREATE POLICY "Users see own history" ON detection_history
  FOR ALL USING (user_id = auth.uid()::text);

-- Sensor readings policies
DROP POLICY IF EXISTS "Users see own sensors" ON sensor_readings;
CREATE POLICY "Users see own sensors" ON sensor_readings
  FOR ALL USING (user_id = auth.uid()::text);

-- Diet plans policies
DROP POLICY IF EXISTS "Users see own diet plans" ON diet_plans;
CREATE POLICY "Users see own diet plans" ON diet_plans
  FOR ALL USING (user_id = auth.uid()::text);

-- Health scores policies
DROP POLICY IF EXISTS "Users see own health scores" ON health_scores;
CREATE POLICY "Users see own health scores" ON health_scores
  FOR ALL USING (user_id = auth.uid()::text);

-- Waste log policies
DROP POLICY IF EXISTS "Users see own waste logs" ON waste_log;
CREATE POLICY "Users see own waste logs" ON waste_log
  FOR ALL USING (user_id = auth.uid()::text);

-- Note: The Python backend uses the Service Role Key, which bypasses RLS entirely.
-- This is correct, as the hardware camera is a trusted backend service linking data
-- via the user_id stored in its .env file.

SELECT 'RLS Policies applied ✅' AS status;
