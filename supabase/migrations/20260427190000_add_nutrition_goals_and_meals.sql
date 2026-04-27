-- Add daily calorie goal to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_calorie_goal INTEGER DEFAULT 2000;

-- Add meal_type to detection_history
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'snack';
