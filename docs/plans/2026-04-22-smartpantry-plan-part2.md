# SmartPantry — Full Implementation Plan (Part 2 of 2)

**Continuation of Part 1** — Covers Phase 4 (Frontend), Phase 5 (Chatbot), Phase 6 (Game), Open Questions, and Full Task Summary.

---

## Phase 4: Frontend Portal Overhaul

**Duration:** 5-7 days · **Risk:** Medium

### Global Changes (before individual pages)

#### Task 4.0A: User Switcher Context

**Files:**
- Create: `src/lib/UserContext.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Sidebar.tsx`

**Steps:**
1. Create a React Context that stores `activeUserId` and `setActiveUserId`
2. Default to `"user_1"`
3. Add a dropdown in the Sidebar footer (replacing "Pi Camera Online" section)
4. Dropdown fetches users from `users` table on mount
5. All pages consume `activeUserId` from context and pass to API calls
6. Supabase realtime subscriptions filter by `user_id`

#### Task 4.0B: Toast Notification System

**Files:**
- Create: `src/components/Toast.tsx`
- Modify: `src/app/page.tsx` — replace inline modal with Toast

**Steps:**
1. Create a reusable toast component (slide-in from top-right, auto-dismiss 5s)
2. Toast types: `added` (green), `removed` (orange), `info` (blue)
3. Triggered by Supabase Realtime detection events
4. Shows: "🍎 Apple has been added to your pantry" or "🥛 Milk has been removed"

#### Task 4.0C: Install charting library

- Run: `npm install recharts` (lightweight, React-native charts)
- Used in: Nutrition, Health Score pages

---

### Task 4.1: Pantry Page Upgrade

**File:** `src/app/page.tsx`

**Current state:** Basic table with name/qty/storage/expiry + detection popup modal.

**Upgrades needed:**
1. **Category filter tabs** — Protein, Dairy, Fruits, Vegetables, Grains, Snacks, Other
2. **Expiry sort/filter** — "Expiring soon" badge (red if <3 days), sortable column
3. **Quantity filter** — Low stock indicator (qty ≤ 1)
4. **Manual add form** — Modal with: name, category (dropdown), quantity, expiry date, storage type
5. **Manual delete button** — Per-row delete with confirmation
6. **Real-time toast** — Replace the full-screen modal with the Toast system
7. **Filter by userId** — All queries scoped to `activeUserId`
8. **Search bar** — Filter pantry items by name (client-side)

### Task 4.2: Nutrition Page Rebuild

**File:** `src/app/nutrition/page.tsx`

**Current state:** Single-item USDA search bar only.

**New design:**
1. **Aggregate dashboard** — Shows total macros for the selected user over a date range
2. **Date range picker** — Today, This Week, This Month, Custom
3. **Macro cards** — Calories, Protein, Carbs, Fat, Fiber (each with progress bar vs daily target)
4. **Recharts bar chart** — Daily breakdown over the selected range
5. **Keep the USDA search** — Move to a secondary tab "Look Up Item"
6. **Data source:** Pull from `detection_history` (action='removed') + pantry nutrition columns

### Task 4.3: Health Score Page Rebuild

**File:** `src/app/health/page.tsx`

**Current state:** Single AI-generated score + 3 macro alerts.

**New design:**
1. **Score circle** — Animated SVG ring (0-100) with color gradient (red→yellow→green)
2. **Score breakdown cards:**
   - Protein Score (0-25)
   - Carb Score (0-25)
   - Fat Score (0-25)
   - Micronutrient Score (0-25)
3. **Textual feedback** — "You're low on protein today, consider adding eggs or lentils"
4. **History line chart** — Recharts line chart of scores over past 7/30 days
5. **Toggle:** 7-day vs 30-day view
6. **Auto-calculate:** On page load, call `/api/health` which calculates score AND saves to `health_scores` table
7. **Data source:** `health_scores` table for history, real-time calculation for today

### Task 4.4: Diet Plan Page Rebuild

**File:** `src/app/diet/page.tsx`

**Current state:** 4 preset goal buttons → generic 1-day meal plan.

**New design:**
1. **Input form:**
   - Current weight (kg) — number input
   - Target weight (kg) — number input
   - Timeline — dropdown: 1 month, 2 months, 3 months, 6 months
   - Goal auto-detected: gain/lose/maintain based on weight difference
2. **Generate button** → calls upgraded `/api/diet`
3. **Plan display:**
   - Markdown-rendered meal plan (keep ReactMarkdown)
   - Section: "✅ Use from your pantry" — items user already has
   - Section: "🛒 Consider buying" — items not in pantry
   - Section: "⚠️ Reduce intake of" — items to avoid
4. **Saved plans list** — Show previous plans from `diet_plans` table
5. **Edit/regenerate** — Button to tweak and regenerate

### Task 4.5: Chatbot — Embedded Widget Mode

**File:** Create `src/components/ChatWidget.tsx`
**Modify:** `src/app/layout.tsx`

**Current state:** Full-page chatbot at `/chatbot`.

**New addition (keep full page too):**
1. Floating chat bubble (bottom-right corner) on ALL pages
2. Click to expand into a slide-up panel (400px wide, 500px tall)
3. Same chat interface as `/chatbot/page.tsx` but in widget form
4. Shares same API route `/api/chat`
5. Automatically includes `activeUserId` in context
6. Quick-action buttons: "What can I cook?", "What's expiring?", "Weekly summary"

### Task 4.6: Waste/Donate Pages (Existing — Minor Updates)

**Files:** `src/app/waste/page.tsx`, `src/app/donate/page.tsx`

- Add `userId` filtering
- Keep existing functionality
- Low priority — no major redesign needed

---

## Phase 5: AI Chatbot Intelligence Upgrade

**Duration:** 2-3 days · **Risk:** Low

### Task 5.1: Structured RAG Context Builder

**File:** Create `src/lib/buildChatContext.ts`

**Purpose:** Build a rich context string for every chat message:

```typescript
export async function buildChatContext(userId: string) {
  // 1. Current pantry items (name, qty, category, expiry)
  // 2. Last 20 detection events (item, action, timestamp)
  // 3. Latest health score + feedback
  // 4. Active diet plan (if any)
  // 5. Items expiring within 3 days
  // Returns formatted string for LLM system prompt
}
```

### Task 5.2: Upgrade chat API route

**File:** `src/app/api/chat/route.ts`

**Changes:**
1. Import and call `buildChatContext(userId)`
2. Use as system prompt (not user message)
3. Add conversation history (last 5 messages) for multi-turn
4. Structured prompt template:
   ```
   You are SmartPantry AI assistant.
   
   CURRENT PANTRY: [items]
   RECENT ACTIVITY: [last 20 events with timestamps]
   HEALTH SCORE: [score/100 + feedback]
   EXPIRING SOON: [items within 3 days]
   ACTIVE DIET PLAN: [if any]
   
   Answer the user's question using this context.
   ```

### Task 5.3: Example queries the chatbot MUST handle

| Query | Expected Behavior |
|---|---|
| "What vegan meals can I make?" | Filter pantry to vegan items, suggest recipes |
| "How much protein this week?" | Sum from detection_history (removed items) × nutrition data |
| "What should I buy for pasta?" | Compare pasta recipe ingredients vs current pantry, list missing |
| "Is my diet balanced?" | Reference health score + macro breakdown |
| "What's expiring soon?" | List items where expiry_date < now + 3 days |

---

## Phase 6: Game Logic (PLAN ONLY — Do Not Implement)

**Duration:** N/A (deferred) · **Placeholder hooks only**

### Gamification Hooks to Add (as code comments)

| Location | Hook | Future Feature |
|---|---|---|
| `page.tsx` (Dashboard) | `// GAME: streak counter component here` | Daily login streak |
| `detection_history` INSERT | `// GAME: award points for adding healthy items` | Points system |
| Health Score page | `// GAME: badge unlock when score > 80 for 7 days` | Achievement badges |
| Diet Plan page | `// GAME: challenge system — "eat 5 fruits this week"` | Weekly challenges |
| Sidebar | `// GAME: leaderboard link for multi-user competition` | Leaderboard |
| Chatbot | `// GAME: chatbot announces level-ups` | Level-up notifications |

### Future Tables (do not create yet)

```sql
-- game_points: user_id, points, source, earned_at
-- game_badges: user_id, badge_id, unlocked_at
-- game_challenges: id, title, description, target, duration
-- game_streaks: user_id, streak_type, current_count, last_activity
```

---

## 🏁 Full Task Summary

| # | Task | Phase | Duration | Priority |
|---|---|---|---|---|
| 1.1 | Replace YOLO model + loader | P1 | 1 day | 🔴 Critical |
| 1.2 | Rewrite detection inference loop | P1 | 1 day | 🔴 Critical |
| 1.3 | Dual camera config toggle | P1 | 0.5 day | 🟡 High |
| 1.4 | Add/Remove user prompt flow | P1 | 1 day | 🔴 Critical |
| 1.5 | userId in all detection payloads | P1 | 0.5 day | 🔴 Critical |
| 2.1 | SQL migration (new tables + columns) | P2 | 0.5 day | 🔴 Critical |
| 2.2 | Update Python Supabase client | P2 | 0.5 day | 🔴 Critical |
| 3.1 | userId in all API routes | P3 | 0.5 day | 🟡 High |
| 3.2 | `/api/nutrition/aggregate` route | P3 | 1 day | 🟡 High |
| 3.3 | `/api/health/history` route | P3 | 0.5 day | 🟡 High |
| 3.4 | Upgrade `/api/diet` route | P3 | 1 day | 🟡 High |
| 3.5 | Upgrade `/api/chat` with RAG | P3 | 0.5 day | 🟡 High |
| 4.0A | User Switcher Context | P4 | 0.5 day | 🔴 Critical |
| 4.0B | Toast Notification System | P4 | 0.5 day | 🟡 High |
| 4.0C | Install recharts | P4 | 5 min | 🟢 Low |
| 4.1 | Pantry Page upgrade | P4 | 1.5 days | 🟡 High |
| 4.2 | Nutrition Page rebuild | P4 | 1.5 days | 🟡 High |
| 4.3 | Health Score Page rebuild | P4 | 1.5 days | 🟡 High |
| 4.4 | Diet Plan Page rebuild | P4 | 1.5 days | 🟡 High |
| 4.5 | Chat Widget (floating) | P4 | 1 day | 🟢 Medium |
| 4.6 | Waste/Donate userId updates | P4 | 0.5 day | 🟢 Low |
| 5.1 | RAG context builder | P5 | 0.5 day | 🟡 High |
| 5.2 | Upgrade chat API route | P5 | 0.5 day | 🟡 High |
| 5.3 | Test chatbot queries | P5 | 0.5 day | 🟡 High |
| 6.x | Game Logic placeholders | P6 | 0.5 day | 🟢 Low |

**Total estimated effort:** ~18-22 developer-days (1 person, full-time)

---

## 📅 Recommended Timeline (1-2 devs)

| Week | Focus | Deliverable |
|---|---|---|
| Week 1 | Phase 1 + Phase 2 | YOLOv8 working, schema migrated, dual camera, add/remove flow |
| Week 2 | Phase 3 + Phase 4 (Dashboard, Nutrition) | All APIs upgraded, Pantry page + Nutrition page live |
| Week 3 | Phase 4 (Health, Diet, Widget) + Phase 5 | All frontend pages complete, chatbot upgraded |
| Week 4 | Phase 6 + Testing + Polish | Game placeholders, integration testing, bug fixes |

---

## ❓ Open Questions (Need Your Input)

### 1. YOLOv8 Model Source
> **Options:**
> - (A) Use a pre-trained community food model (e.g., from Roboflow Universe — fastest, ~80% accuracy)
> - (B) Fine-tune YOLOv8n on Food-101 yourself (2-4 hours on GPU, better accuracy for your items)
> - (C) Use a hybrid: YOLOv8 for detection + CLIP/OpenAI Vision for classification (most accurate, but slower)
>
> **Recommendation:** Option (A) to start, upgrade to (B) later.

### 2. LLM Provider
> Currently using Cohere Command-A. Should we:
> - (A) Keep Cohere (free tier available, already integrated)
> - (B) Switch to OpenAI GPT-4o-mini (better structured output, paid)
> - (C) Switch to Claude API (best reasoning, paid)
> - (D) Add a provider abstraction so you can switch later
>
> **Recommendation:** (D) — abstract with a simple `llm_client.ts` wrapper, keep Cohere as default.

### 3. ESP32 Firmware
> The plan includes the `sensor_readings` table but doesn't cover ESP32 firmware code. Do you want:
> - (A) I write the ESP32 Arduino sketch that POSTs to Supabase
> - (B) You handle ESP32 firmware separately
> - (C) Skip ESP32 for now, focus on camera + frontend

### 4. Nutrition Data Source
> For per-item nutrition when auto-detected (not barcode):
> - (A) Pre-fill from `food_database.json` (add nutrition fields to existing items)
> - (B) Auto-lookup via USDA API on detection (slower, more accurate)
> - (C) Both — local fallback + USDA enrichment
>
> **Recommendation:** (C)

### 5. Deployment Target
> You mentioned testing only. Confirm:
> - Frontend: `localhost:3000` only? Or deploy to Vercel?
> - Detection script: Laptop webcam only for now? Or test on actual Pi?

---

## 🛡️ Risk Matrix

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| YOLOv8 food model accuracy <70% | High | Medium | Use Roboflow pre-trained + fallback to barcode |
| Cohere API rate limits | Medium | Low | Add retry logic + local cache |
| Pi camera latency with YOLOv8 | Medium | Medium | Export to TFLite INT8, use YOLOv8n (smallest) |
| Supabase free tier row limits | Low | Low | Cleanup old detection_history periodically |
| Multi-user data leaks | Medium | Low | Always filter by user_id server-side |

---

**Plan complete. Awaiting your approval + answers to the 5 open questions before generating subtasks.**
