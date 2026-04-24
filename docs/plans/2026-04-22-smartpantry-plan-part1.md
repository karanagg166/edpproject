# SmartPantry — Full Implementation Plan (Part 1 of 2)

**Goal:** Transform the existing Smart Pantry prototype into a multi-user AI pantry management system with upgraded ML detection, real-time sync, nutrition analytics, diet planning, health scoring, and an AI chatbot.

**Architecture:** Python detection service (Raspberry Pi / laptop) → Supabase (real-time DB) → Next.js 14 frontend. Detection upgraded from YOLOv4-tiny (COCO, 80 generic classes) to YOLOv8 fine-tuned on food datasets. All data scoped per `userId`.

**Tech Stack:** Python 3.10+, Ultralytics YOLOv8, pyzbar, OpenCV, Supabase (Postgres + Realtime), Next.js 14, React 18, TailwindCSS 3, Cohere Command-A, USDA FoodData Central API, Open Food Facts API

---

## 📊 Current Codebase Audit

### What Exists

| Component | File(s) | Status |
|---|---|---|
| Detection loop | `detector.py` (289 lines) | ⚠️ YOLOv4-tiny COCO — only 12 food classes |
| Barcode scanner | `barcode_scanner.py` (142 lines) | ✅ Multi-pass pyzbar + Open Food Facts |
| Supabase client | `supabase_client.py` (121 lines) | ✅ Upsert pantry, log detections, offline queue |
| Food metadata | `food_database.json` (2384 lines) | ✅ 100+ items with shelf life |
| Dashboard | `src/app/page.tsx` | ✅ Real-time pantry + detection popup |
| Chatbot | `src/app/chatbot/page.tsx` | ✅ Cohere-powered with pantry context |
| Nutrition | `src/app/nutrition/page.tsx` | ⚠️ Single-item USDA lookup only |
| Health | `src/app/health/page.tsx` | ⚠️ AI score, no history/charts |
| Diet | `src/app/diet/page.tsx` | ⚠️ Generic goals, no weight/pantry context |
| API routes | `src/app/api/{chat,diet,health,nutrition}/` | ✅ Functional |

### Critical Problems

1. **YOLOv4-tiny COCO** — Only 12 food classes. Can't detect eggs, milk, bread, rice, etc.
2. **No userId** — Everything is global. No user scoping anywhere.
3. **No ADD vs REMOVE** — Camera auto-adds. No "adding or removing?" prompt.
4. **No dual camera toggle** — Hardcoded webcam scan, no Pi camera config.
5. **Nutrition** — Single-item lookup only. No aggregate, date filters, or charts.
6. **Health** — No score history or macro breakdown charts.
7. **Diet** — No weight/target inputs, not pantry-aware.
8. **Chatbot** — No item history context (timestamps, add/remove events).
9. **No ESP32 table** — No sensor_readings schema.

---

## Phase 1: Camera / ML Detection Upgrade ⭐

**Duration:** 3-5 days · **Risk:** High

### Why YOLOv4-tiny Must Go

`coco.names` has 80 classes — only 12 are food. Cannot detect eggs, milk, rice, bread, lentils. YOLOv4-tiny via OpenCV DNN is ~3-5 FPS on Pi 4. Darknet is deprecated.

### Replacement Stack

| Component | Library | Why |
|---|---|---|
| Detection | `ultralytics` YOLOv8n | PyTorch-native, food fine-tuning, ARM-compatible |
| Food Dataset | Food-101 + Open Images food subset | Real food images with boxes |
| Barcode | `pyzbar` (keep) | Already works |
| Model Format | ONNX (laptop) / TFLite INT8 (Pi) | Quantized for Pi |

### Task 1.1: Replace YOLO model + loader

- Delete: `yolov4-tiny.weights`, `yolov4-tiny.cfg`, `coco.names`
- Create: `models/yolov8n-food.pt`, `models/food_classes.txt`
- Modify: `detector.py` lines 38-62, `requirements.txt`
- Add `ultralytics>=8.0.0` and `onnxruntime` to requirements
- Replace OpenCV DNN loader with `ultralytics.YOLO("models/yolov8n-food.pt")`

### Task 1.2: Rewrite detection inference loop

- Modify: `detector.py` lines 204-267
- Replace manual blob/forward/NMS with `model.predict(frame, conf=0.35)`
- Extract via `results[0].boxes.cls`, `.conf`, `.xyxy`
- Keep confirmation buffer logic
- Remove ROI cropping (YOLOv8 handles full-frame better)

### Task 1.3: Dual camera config toggle

- Create: `config.py` with `CAMERA_SOURCE`, `USER_ID`, `MODEL_PATH`, etc.
- Modify: `detector.py` `get_camera()`
- If `"picamera"`: use `picamera2` (Pi-native)
- If `"webcam"`: use `cv2.VideoCapture(index)`

### Task 1.4: Add/Remove user prompt flow

- Modify: `detector.py` `process_confirmed_item()`
- Create: `supabase_client.py` `remove_from_pantry()`
- After confirmation: show "Press A=ADD, R=REMOVE, D=DISMISS"
- Wait keypress (10s timeout, default=ADD)
- Log action type in `detection_history`: `action: "added"|"removed"`

### Task 1.5: userId in all detection payloads

- Read `USER_ID` from `config.py` or CLI `--user user_1`
- Add `user_id` to all Supabase calls
- Filter all queries by `user_id`

---

## Phase 2: Database Schema Redesign

**Duration:** 1-2 days · **Risk:** Medium

### Task 2.1: SQL Migration (run in Supabase SQL Editor)

```sql
-- Add user_id to existing tables
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'user_1';
ALTER TABLE detections ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'user_1';
ALTER TABLE waste_log ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'user_1';

-- Rename detections → detection_history
ALTER TABLE detections RENAME TO detection_history;
ALTER TABLE detection_history ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'added';

-- Nutrition columns on pantry
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS calories_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS protein_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS fat_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS carbs_per_100g NUMERIC DEFAULT 0;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS fiber_per_100g NUMERIC DEFAULT 0;

-- ESP32 sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, temperature NUMERIC, humidity NUMERIC,
  weight_grams NUMERIC, sensor_type TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, current_weight NUMERIC, target_weight NUMERIC,
  timeline_weeks INTEGER, plan_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health score history
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, score INTEGER,
  protein_score INTEGER, carb_score INTEGER, fat_score INTEGER, micro_score INTEGER,
  feedback TEXT, scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple users table (no auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO users (id, display_name) VALUES
  ('user_1', 'Karan'), ('user_2', 'Test User 2')
ON CONFLICT DO NOTHING;

-- Realtime + Indexes
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings, detection_history, health_scores;
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_user ON detection_history(user_id);
```

### Task 2.2: Update Python Supabase client

- Modify: `supabase_client.py` — all functions take `user_id` param
- Add `remove_from_pantry(item_name, user_id)` function

---

## Phase 3: Backend API Layer

**Duration:** 2-3 days · **Risk:** Low

> **Decision:** Keep Next.js API routes (already working). No separate FastAPI needed.

### Task 3.1: Add userId to all existing API routes

- Modify: all `src/app/api/*/route.ts`
- Read `userId` from query/body, filter all Supabase queries by it

### Task 3.2: New route — `/api/nutrition/aggregate`

- Create: `src/app/api/nutrition/aggregate/route.ts`
- Fetch consumed items from `detection_history` (action='removed') for date range
- Cross-reference nutrition columns + USDA API
- Return daily totals: calories, protein, carbs, fat, fiber

### Task 3.3: New route — `/api/health/history`

- Create: `src/app/api/health/history/route.ts`
- Return health_scores history for charting (7/30 day views)

### Task 3.4: Upgrade `/api/diet`

- Accept: `{ userId, currentWeight, targetWeight, timelineWeeks }`
- Fetch user's pantry, pass to Cohere with weight goals
- Save plan to `diet_plans` table

### Task 3.5: Upgrade `/api/chat` with richer context

- Fetch: pantry items + last 20 detection events + latest health score
- Build structured context for Cohere (RAG-style injection)

---

**→ Continued in Part 2: Frontend Pages, Chatbot Widget, Game Logic Placeholders, Open Questions**
