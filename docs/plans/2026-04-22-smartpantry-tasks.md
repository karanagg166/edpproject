# SmartPantry — Detailed Task Execution List

Based on the default choices for the open questions:
1. **YOLOv8 Model**: Pre-trained community model (Roboflow).
2. **LLM Provider**: Abstracted wrapper, Cohere as default.
3. **ESP32**: Skip firmware for now, focus on camera + frontend.
4. **Nutrition Source**: Local DB fallback + USDA API enrichment.
5. **Deployment**: Localhost `3000` + laptop webcam.

---

## Phase 1: Camera / ML Detection Upgrade

### Task 1.1: Replace YOLO model + loader
- [ ] Add `ultralytics>=8.0.0` and `onnxruntime` to `requirements.txt`.
- [ ] Create `models/` directory.
- [ ] Download a pretrained YOLOv8n model (`yolov8n.pt`) as a placeholder until we fetch a food-specific one.
- [ ] Create `models/food_classes.txt` with COCO food classes (or full food-101 classes).
- [ ] Update `detector.py` (lines 38-62) to remove OpenCV DNN logic and initialize `ultralytics.YOLO`.
- [ ] Delete `yolov4-tiny.weights`, `yolov4-tiny.cfg`, and `coco.names`.

### Task 1.2: Rewrite detection inference loop
- [ ] Update `detector.py` (lines 204-267) to use `model.predict(frame, conf=0.35)`.
- [ ] Extract bounding boxes, class IDs, and confidences from YOLOv8 results.
- [ ] Map class IDs to food names.
- [ ] Feed results into the existing `detection_buffer` logic.
- [ ] Remove hardcoded ROI cropping.

### Task 1.3: Dual camera config toggle
- [ ] Create `config.py` with `CAMERA_SOURCE`, `CAMERA_INDEX`, `USER_ID`, etc.
- [ ] Update `get_camera()` in `detector.py` to use `CAMERA_SOURCE`.
- [ ] Implement conditional logic for webcam (`cv2.VideoCapture`) vs `picamera2` (placeholder for Pi).

### Task 1.4: Add/Remove user prompt flow
- [ ] Update `supabase_client.py` to add `remove_from_pantry(item_payload)`.
- [ ] Update `process_confirmed_item()` in `detector.py` to display an OpenCV text prompt: "Press A to ADD, R to REMOVE, D to DISMISS".
- [ ] Implement `cv2.waitKey` timeout loop for user response.
- [ ] Route action to `add_to_pantry` or `remove_from_pantry`.
- [ ] Include action type (`added` or `removed`) in `log_detection`.

### Task 1.5: userId in all detection payloads
- [ ] Read `USER_ID` from `config.py`.
- [ ] Add `user_id` to `item_payload` and `det_payload` in `process_confirmed_item()`.
- [ ] Update `add_to_pantry`, `remove_from_pantry`, and `log_detection` in `supabase_client.py` to handle `user_id`.

---

## Phase 2: Database Schema Redesign

### Task 2.1: SQL Migration
- [ ] Write SQL script to add `user_id` to `pantry`, `detections` (rename to `detection_history`), and `waste_log`.
- [ ] Add nutrition columns to `pantry`.
- [ ] Create new tables: `sensor_readings`, `diet_plans`, `health_scores`, `users`.
- [ ] Execute migration script against Supabase instance.

### Task 2.2: Update Python Supabase client
- [ ] Update `supabase_client.py` functions to include `user_id` in all inserts/upserts.
- [ ] Ensure offline queue handles `user_id`.

---

## Phase 3: Backend API Layer

### Task 3.1: Add userId to all existing API routes
- [ ] Update `/api/chat/route.ts` to expect `userId`.
- [ ] Update `/api/diet/route.ts` to expect `userId`.
- [ ] Update `/api/health/route.ts` to expect `userId`.
- [ ] Update `/api/nutrition/route.ts` to expect `userId`.
- [ ] Update Supabase queries within these routes to filter by `user_id`.

### Task 3.2: New route — `/api/nutrition/aggregate`
- [ ] Create `src/app/api/nutrition/aggregate/route.ts`.
- [ ] Implement fetching of `detection_history` (removed items) for a given `userId` and date range.
- [ ] Calculate total macros.

### Task 3.3: New route — `/api/health/history`
- [ ] Create `src/app/api/health/history/route.ts`.
- [ ] Implement fetching of `health_scores` for charting.

### Task 3.4: Upgrade `/api/diet`
- [ ] Read `currentWeight`, `targetWeight`, `timelineWeeks` from request.
- [ ] Enhance Cohere prompt to generate a more personalized plan.
- [ ] Implement saving the plan to the `diet_plans` table.

### Task 3.5: Upgrade `/api/chat` with richer context
- [ ] Create `src/lib/buildChatContext.ts`.
- [ ] Implement fetching recent events, pantry items, and health scores to build the context string.
- [ ] Update `/api/chat/route.ts` to use this builder.

---

## Phase 4: Frontend Portal Overhaul

### Task 4.0: Global Changes
- [ ] Create `src/lib/UserContext.tsx`.
- [ ] Update `layout.tsx` to wrap the app in `UserProvider`.
- [ ] Update `Sidebar.tsx` to include a user switcher.
- [ ] Create `src/components/Toast.tsx` and replace modal in `page.tsx`.
- [ ] `npm install recharts`.

### Task 4.1: Pantry Page upgrade
- [ ] Implement category tabs.
- [ ] Implement expiry styling and manual add/delete buttons.
- [ ] Ensure all fetches filter by `activeUserId`.

### Task 4.2: Nutrition Page rebuild
- [ ] Build aggregate dashboard with Recharts.
- [ ] Add date range filter.
- [ ] Move USDA search to a sub-tab.

### Task 4.3: Health Score Page rebuild
- [ ] Build SVG score circle.
- [ ] Build macro score breakdown cards.
- [ ] Build history line chart.

### Task 4.4: Diet Plan Page rebuild
- [ ] Build input form for weight/goals.
- [ ] Enhance plan display with "use from pantry" sections.
- [ ] Build history view for past plans.

### Task 4.5: Chat Widget
- [ ] Create `src/components/ChatWidget.tsx` (floating bubble).
- [ ] Add to `layout.tsx`.

---

## Phase 5: AI Chatbot Intelligence Upgrade

### Task 5.1 & 5.2
- [ ] Refine the RAG context and system prompts based on testing.

### Task 5.3: Testing
- [ ] Test specific queries: "What vegan meals?", "How much protein?", etc.

---

## Phase 6: Game Logic

### Task 6.1: Placeholders
- [ ] Add `// GAME:` comments in relevant frontend components for future gamification hooks.
