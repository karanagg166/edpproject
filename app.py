import re
import os
import json
import time
import sqlite3
from datetime import datetime, timedelta
from collections import deque

import cv2
import numpy as np
import requests
import cohere
from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv

# ===============================
# CONFIGURATION
# ===============================
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
USDA_API_KEY = os.getenv("USDA_API_KEY", "")
USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

co = cohere.Client(COHERE_API_KEY) if COHERE_API_KEY else None

# ===============================
# FOOD CLASS MAPPING
# ===============================
FOOD_CLASSES_PATH = os.path.join(os.path.dirname(__file__), "food_classes.json")

food_class_map = {}
if os.path.exists(FOOD_CLASSES_PATH):
    with open(FOOD_CLASSES_PATH, "r") as f:
        food_class_map = json.load(f)
    print(f"✅ Loaded {len(food_class_map)} food classes")
else:
    print("⚠️ food_classes.json not found — all COCO classes will be used")

# Default expiry days by category
EXPIRY_DEFAULTS = {
    "fruit": 7,
    "vegetable": 7,
    "prepared": 3,
    "bakery": 5,
    "beverage": 30,
    "container": 7,
    "utensil": 0,
}

# ===============================
# SQLITE DATABASE
# ===============================
DB_PATH = os.path.join(os.path.dirname(__file__), "smart_pantry.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pantry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            quantity INTEGER DEFAULT 0,
            expiry TEXT DEFAULT 'Not Set',
            category TEXT DEFAULT 'other',
            added_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waste_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            score INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detection_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            confidence REAL DEFAULT 0,
            detected_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("INSERT OR IGNORE INTO waste_stats (id, score, streak) VALUES (1, 0, 0)")

    conn.commit()
    conn.close()


init_db()

# ===============================
# YOLOv4 Tiny MODEL
# ===============================
weights_path = "yolov4-tiny.weights"
config_path = "yolov4-tiny.cfg"
names_path = "coco.names"

yolo_loaded = False
net = None
classes = []
output_layers = []

if os.path.exists(weights_path) and os.path.exists(config_path) and os.path.exists(names_path):
    try:
        net = cv2.dnn.readNet(weights_path, config_path)
        net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

        with open(names_path, "r") as f:
            classes = [line.strip() for line in f.readlines()]

        layer_names = net.getLayerNames()
        output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers().flatten()]
        yolo_loaded = True
        print("✅ YOLO model loaded successfully")
    except Exception as e:
        print(f"⚠️ YOLO model failed to load: {e}")
else:
    print("⚠️ YOLO model files not found — camera detection disabled")

# ===============================
# CAMERA (Graceful)
# ===============================
def get_camera():
    for i in range(10):
        cap = cv2.VideoCapture(i, cv2.CAP_V4L2)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(f"✅ Camera detected at index: {i}")
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                return cap
        cap.release()
    return None


camera = get_camera()
if camera is None:
    print("⚠️ No camera detected — camera features disabled (app still runs)")

# ===============================
# DETECTION STATE
# ===============================
last_detected = None
last_detection_time = 0
DETECTION_COOLDOWN = 5

# Phase 1: Confidence buffer — confirms item after 3/5 same detections
BUFFER_SIZE = 5
CONFIRM_THRESHOLD = 3
detection_buffer = deque(maxlen=BUFFER_SIZE)
confirmed_item = None
confirmed_confidence = 0.0

# Phase 3: Frame skip — only run YOLO every Nth frame
FRAME_SKIP = 3
frame_count = 0

# Detection history (last 10 confirmed items)
detection_history = deque(maxlen=10)


# ===============================
# HELPER: Food Class Filter
# ===============================
def is_food_item(label):
    """Check if a COCO label is a food item (not utensil)."""
    if not food_class_map:
        return True  # no filter loaded, accept all

    if label not in food_class_map:
        return False

    info = food_class_map[label]
    # Skip utensils
    if info.get("category") == "utensil":
        return False

    return True


def get_food_display_name(label):
    """Get pantry-friendly display name for a COCO label."""
    if label in food_class_map:
        return food_class_map[label]["display"]
    return label.title()


def get_food_category(label):
    """Get food category for expiry defaults."""
    if label in food_class_map:
        return food_class_map[label].get("category", "other")
    return "other"


def get_default_expiry(category):
    """Calculate default expiry date based on food category."""
    days = EXPIRY_DEFAULTS.get(category, 7)
    if days == 0:
        return "N/A"
    expiry_date = datetime.now() + timedelta(days=days)
    return expiry_date.strftime("%Y-%m-%d")


# ===============================
# HELPER: Get Pantry Items
# ===============================
def get_pantry_items():
    conn = get_db()
    items = conn.execute(
        "SELECT name, quantity, expiry, category FROM pantry WHERE quantity > 0 ORDER BY name"
    ).fetchall()
    conn.close()
    return [dict(item) for item in items]


# ===============================
# HELPER: USDA Nutrition Lookup
# ===============================
def get_usda_nutrition(food_name, quantity_grams):
    """Lookup nutrition from USDA API. Returns dict or None."""
    result = {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}

    params = {
        "api_key": USDA_API_KEY,
        "query": food_name,
        "pageSize": 1
    }

    try:
        response = requests.get(USDA_SEARCH_URL, params=params, timeout=10)
        data = response.json()
        foods = data.get("foods", [])
        if not foods:
            return None
    except Exception:
        return None

    nutrients = foods[0].get("foodNutrients", [])
    factor = quantity_grams / 100

    for nutrient in nutrients:
        nid = nutrient.get("nutrientId")
        value = nutrient.get("value", 0)

        if nid == 1008:
            result["calories"] = round(value * factor, 2)
        elif nid == 1003:
            result["protein"] = round(value * factor, 2)
        elif nid == 1004:
            result["fat"] = round(value * factor, 2)
        elif nid == 1005:
            result["carbs"] = round(value * factor, 2)

    return result


# ===============================
# COHERE AI FUNCTIONS
# ===============================
def get_ai_response(prompt):
    if not co:
        return "⚠️ Cohere API key not configured. Please add COHERE_API_KEY to .env file."
    try:
        response = co.chat(
            model="command-r",
            message=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error contacting AI: {str(e)}"


def get_chatbot_response(user_message):
    pantry = get_pantry_items()
    prompt = f"""You are a helpful AI assistant for a Smart Pantry application.

Pantry Items:
{json.dumps(pantry, indent=2) if pantry else "No items in pantry"}

User Question:
{user_message}

Answer clearly and helpfully. If the question is about the pantry, use the pantry data. Otherwise, answer normally."""
    return get_ai_response(prompt)


# ===============================
# YOLO DETECTION (Food-Filtered)
# ===============================
def detect_food_items(frame):
    """Detect food items only. Returns list of (label, confidence, bbox)."""
    if not yolo_loaded:
        return []

    height, width = frame.shape[:2]

    # Phase 3: ROI — crop center 70% of frame
    roi_x = int(width * 0.15)
    roi_y = int(height * 0.15)
    roi_w = int(width * 0.70)
    roi_h = int(height * 0.70)
    roi_frame = frame[roi_y:roi_y + roi_h, roi_x:roi_x + roi_w]

    blob = cv2.dnn.blobFromImage(
        roi_frame,
        scalefactor=1 / 255.0,
        size=(320, 320),
        swapRB=True,
        crop=False
    )

    net.setInput(blob)
    outputs = net.forward(output_layers)

    boxes = []
    confidences = []
    class_ids = []

    roi_height, roi_width = roi_frame.shape[:2]

    for out in outputs:
        for detection in out:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]

            if confidence > 0.45:
                label = classes[class_id] if class_id < len(classes) else ""

                # Phase 1: Only accept food items
                if not is_food_item(label):
                    continue

                center_x = int(detection[0] * roi_width) + roi_x
                center_y = int(detection[1] * roi_height) + roi_y
                w = int(detection[2] * roi_width)
                h = int(detection[3] * roi_height)
                x = int(center_x - w / 2)
                y = int(center_y - h / 2)

                boxes.append([x, y, w, h])
                confidences.append(float(confidence))
                class_ids.append(class_id)

    indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.45, 0.4) if len(boxes) > 0 else []

    results = []
    if len(indexes) > 0:
        for i in indexes.flatten():
            label = classes[class_ids[i]]
            conf = confidences[i]
            bbox = boxes[i]
            results.append((label, conf, bbox))

    return results


def draw_detections(frame, detections):
    """Draw bounding boxes with food labels and confidence."""
    height, width = frame.shape[:2]

    # Draw ROI guide rectangle (subtle)
    roi_x = int(width * 0.15)
    roi_y = int(height * 0.15)
    roi_w = int(width * 0.70)
    roi_h = int(height * 0.70)
    cv2.rectangle(frame, (roi_x, roi_y), (roi_x + roi_w, roi_y + roi_h),
                  (100, 100, 100), 1, cv2.LINE_AA)

    for label, conf, bbox in detections:
        x, y, w, h = bbox
        display_name = get_food_display_name(label)
        category = get_food_category(label)

        # Color by category
        colors = {
            "fruit": (0, 200, 100),
            "vegetable": (0, 180, 0),
            "prepared": (0, 150, 255),
            "bakery": (0, 200, 255),
            "beverage": (255, 150, 0),
            "container": (200, 200, 0),
        }
        color = colors.get(category, (0, 255, 0))

        # Bounding box
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Label background
        text = f"{display_name} {conf:.0%}"
        text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)[0]
        cv2.rectangle(frame, (x, y - text_size[1] - 10), (x + text_size[0] + 4, y), color, -1)
        cv2.putText(frame, text, (x + 2, y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

    return frame


# ===============================
# CAMERA STREAM
# ===============================
def generate_frames():
    global last_detected, last_detection_time, camera
    global frame_count, detection_buffer, confirmed_item, confirmed_confidence

    while True:
        if camera is None or not camera.isOpened():
            camera = get_camera()
            if camera is None:
                time.sleep(1)
                continue

        success, frame = camera.read()
        if not success:
            camera.release()
            camera = get_camera()
            continue

        frame = cv2.resize(frame, (640, 480))
        frame_count += 1

        # Phase 3: Only run detection every Nth frame
        if frame_count % FRAME_SKIP == 0:
            try:
                detections = detect_food_items(frame)
                frame = draw_detections(frame, detections)

                if detections:
                    # Take highest confidence detection
                    best = max(detections, key=lambda d: d[1])
                    label, conf, _ = best

                    # Phase 1: Add to confidence buffer
                    detection_buffer.append(label)

                    # Check if confirmed (3/5 same label)
                    if len(detection_buffer) >= CONFIRM_THRESHOLD:
                        from collections import Counter
                        counts = Counter(detection_buffer)
                        most_common, count = counts.most_common(1)[0]

                        if count >= CONFIRM_THRESHOLD:
                            current_time = time.time()
                            display_name = get_food_display_name(most_common)

                            if (display_name != confirmed_item or
                                    current_time - last_detection_time > DETECTION_COOLDOWN):
                                confirmed_item = display_name
                                confirmed_confidence = conf
                                last_detected = most_common
                                last_detection_time = current_time

                                # Log to detection history
                                detection_history.append({
                                    "item": display_name,
                                    "confidence": round(conf * 100, 1),
                                    "time": datetime.now().strftime("%H:%M:%S")
                                })

                                # Log to database
                                try:
                                    conn = get_db()
                                    conn.execute(
                                        "INSERT INTO detection_log (item_name, confidence) VALUES (?, ?)",
                                        (display_name, round(conf, 3))
                                    )
                                    conn.commit()
                                    conn.close()
                                except Exception:
                                    pass

                                print(f"✅ Confirmed: {display_name} ({conf:.0%})")
                                detection_buffer.clear()
                else:
                    # No food detected — slowly clear buffer
                    if len(detection_buffer) > 0 and frame_count % (FRAME_SKIP * 5) == 0:
                        detection_buffer.clear()

            except Exception as e:
                print("Detection error:", e)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


# ===============================
# ROUTES — Pages
# ===============================
@app.route('/')
def dashboard():
    items = get_pantry_items()
    return render_template("index.html", food_items=items)


@app.route('/chatbot')
def chatbot_page():
    return render_template("chatbot.html")


@app.route('/nutrition')
def nutrition_page():
    return render_template("nutrition.html")


@app.route('/diet')
def diet_page():
    return render_template("diet.html")


@app.route('/health')
def health():
    return render_template("health.html")


@app.route('/waste')
def waste():
    return render_template("waste.html")


@app.route('/donate')
def donate():
    return render_template("donate.html")


# ===============================
# ROUTES — Camera & Detection
# ===============================
@app.route('/video')
def video():
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


@app.route('/get_detected_item')
def get_detected_item():
    global last_detected
    raw_label = last_detected
    last_detected = None

    if raw_label:
        display = get_food_display_name(raw_label)
        category = get_food_category(raw_label)
        return jsonify({
            "item": display,
            "raw_label": raw_label,
            "category": category,
            "confidence": round(confirmed_confidence * 100, 1),
            "buffer_count": len(detection_buffer),
            "buffer_size": BUFFER_SIZE
        })

    return jsonify({
        "item": None,
        "buffer_count": len(detection_buffer),
        "buffer_size": BUFFER_SIZE
    })


@app.route('/detection_history')
def get_detection_history():
    return jsonify(list(detection_history))


# ===============================
# ROUTES — Chatbot API
# ===============================
@app.route('/get_response', methods=['POST'])
def get_response():
    user_input = request.json.get("message", "")
    reply = get_chatbot_response(user_input)
    return jsonify({"reply": reply})


# ===============================
# ROUTES — Diet Plan
# ===============================
@app.route("/generate_diet", methods=["POST"])
def generate_diet():
    data = request.json
    goal = data.get("goal", "balanced healthy diet")

    prompt = f"""You are a professional nutritionist.

Create a SIMPLE 1-day diet plan for the goal: {goal}.

Return ONLY the diet plan in this format:

Breakfast:
- item
- item

Lunch:
- item
- item

Dinner:
- item
- item

Snacks:
- item
- item"""

    diet_text = get_ai_response(prompt)
    return jsonify({"diet": diet_text})


# ===============================
# ROUTES — Nutrition Calculator
# ===============================
@app.route('/nutrition_calc', methods=['POST'])
def nutrition_calc():
    data = request.get_json()

    if not data or "items" not in data:
        return jsonify({"calories": 0, "protein": 0, "fat": 0, "carbs": 0, "not_found": []})

    items = data["items"]
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    not_found = []

    for item in items:
        food_name = item.get("food", "").strip()
        quantity = float(item.get("quantity", 0))

        if food_name == "" or quantity == 0:
            continue

        result = get_usda_nutrition(food_name, quantity)
        if result is None:
            not_found.append(food_name)
            continue

        total_calories += result["calories"]
        total_protein += result["protein"]
        total_fat += result["fat"]
        total_carbs += result["carbs"]

    return jsonify({
        "calories": round(total_calories, 2),
        "protein": round(total_protein, 2),
        "fat": round(total_fat, 2),
        "carbs": round(total_carbs, 2),
        "not_found": not_found
    })


# ===============================
# ROUTES — Pantry CRUD
# ===============================
@app.route("/update_pantry", methods=["POST"])
def update_pantry():
    data = request.json

    item = data.get("item", "").strip()
    quantity = data.get("quantity")
    action = data.get("action")
    expiry = data.get("expiry", "").strip()

    if not item or quantity is None or action is None:
        return jsonify({"error": "Invalid data"}), 400

    quantity = int(quantity)
    conn = get_db()

    # Determine category and default expiry
    raw_label = item.lower()
    category = get_food_category(raw_label)
    if not expiry:
        expiry = get_default_expiry(category)

    if action == "add":
        conn.execute("""
            INSERT INTO pantry (name, quantity, expiry, category)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                quantity = quantity + ?,
                expiry = CASE WHEN excluded.expiry != 'Not Set' THEN excluded.expiry ELSE pantry.expiry END
        """, (item, quantity, expiry, category, quantity))

    elif action == "remove":
        conn.execute("""
            UPDATE pantry SET quantity = MAX(0, quantity - ?) WHERE name = ? COLLATE NOCASE
        """, (quantity, item))

    conn.commit()
    items = get_pantry_items()
    conn.close()

    return jsonify({
        "message": f"{action} operation successful",
        "pantry": items
    })


@app.route("/manual_add", methods=["POST"])
def manual_add():
    """Add food item manually without camera."""
    data = request.json

    name = data.get("name", "").strip()
    quantity = data.get("quantity", 1)
    expiry = data.get("expiry", "").strip()

    if not name:
        return jsonify({"error": "Food name is required"}), 400

    quantity = int(quantity)
    raw_label = name.lower()
    category = get_food_category(raw_label)

    if not expiry:
        expiry = get_default_expiry(category)

    conn = get_db()
    conn.execute("""
        INSERT INTO pantry (name, quantity, expiry, category)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            quantity = quantity + ?,
            expiry = CASE WHEN excluded.expiry != 'Not Set' THEN excluded.expiry ELSE pantry.expiry END
    """, (name, quantity, expiry, category, quantity))
    conn.commit()
    items = get_pantry_items()
    conn.close()

    return jsonify({
        "message": f"Added {quantity}x {name} to pantry",
        "pantry": items
    })


@app.route("/set_expiry", methods=["POST"])
def set_expiry():
    """Update expiry date for an existing pantry item."""
    data = request.json
    name = data.get("name", "").strip()
    expiry = data.get("expiry", "").strip()

    if not name or not expiry:
        return jsonify({"error": "Name and expiry required"}), 400

    conn = get_db()
    conn.execute("UPDATE pantry SET expiry = ? WHERE name = ? COLLATE NOCASE", (expiry, name))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Expiry updated for {name}"})


@app.route("/delete_item", methods=["POST"])
def delete_item():
    """Delete a pantry item completely."""
    data = request.json
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Name required"}), 400

    conn = get_db()
    conn.execute("DELETE FROM pantry WHERE name = ? COLLATE NOCASE", (name,))
    conn.commit()
    items = get_pantry_items()
    conn.close()

    return jsonify({"message": f"Deleted {name}", "pantry": items})


@app.route("/get_items")
def get_items():
    return jsonify(get_pantry_items())


# ===============================
# ROUTES — Waste Reduction
# ===============================
@app.route("/waste_stats")
def waste_stats():
    conn = get_db()
    data = conn.execute("SELECT score, streak FROM waste_stats WHERE id = 1").fetchone()
    conn.close()

    score = data["score"]
    streak = data["streak"]

    if score >= 200:
        reward = "🥇 Gold Saver"
    elif score >= 100:
        reward = "🥈 Silver Saver"
    elif score >= 50:
        reward = "🥉 Bronze Saver"
    else:
        reward = "No rewards yet"

    return jsonify({"score": score, "streak": streak, "reward": reward})


@app.route("/use_food", methods=["POST"])
def use_food():
    conn = get_db()
    conn.execute("UPDATE waste_stats SET score = score + 10, streak = streak + 1 WHERE id = 1")
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})


@app.route("/waste_food", methods=["POST"])
def waste_food():
    conn = get_db()
    conn.execute("UPDATE waste_stats SET score = MAX(0, score - 5), streak = 0 WHERE id = 1")
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})


# ===============================
# ROUTES — Health Report
# ===============================
@app.route("/health_report")
def health_report():
    items = get_pantry_items()

    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0

    for item in items:
        qty = int(item.get("quantity", 0))
        name = item.get("name", "")
        result = get_usda_nutrition(name, qty * 100)

        if result:
            total_calories += result["calories"]
            total_protein += result["protein"]
            total_carbs += result["carbs"]
            total_fat += result["fat"]

    return jsonify({
        "calories": round(total_calories, 2),
        "protein": round(total_protein, 2),
        "carbs": round(total_carbs, 2),
        "fat": round(total_fat, 2)
    })


# ===============================
# ROUTES — Food Donation
# ===============================
@app.route("/find_donation", methods=["POST"])
def find_donation():
    data = request.json
    location = data.get("location", "")

    prompt = f"""Find 3 NGOs or food donation centers in {location} where people can donate food.

Return in this format for each:
1. **Name** - Description - Website URL"""

    result = get_ai_response(prompt)

    safe_text = result.replace("<", "&lt;").replace(">", "&gt;")
    safe_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', safe_text)
    safe_text = safe_text.replace("\n", "<br>")

    return jsonify({"result": safe_text})


# ===============================
# RUN APP
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
