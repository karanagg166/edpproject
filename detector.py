"""
Smart Pantry — Camera Detection Service
Runs on Raspberry Pi or laptop. Uses YOLOv8 for food detection + pyzbar for barcodes.
Edit config.py to switch camera source, user, and model paths.
"""
import os
import sys
import time
import json
import argparse
from threading import Thread, Lock
from datetime import datetime, timedelta
from collections import deque, Counter
import cv2
import numpy as np

# ---- Local modules ----
from config import (
    CAMERA_SOURCE, CAMERA_INDEX, USER_ID,
    CAPTURE_WIDTH, CAPTURE_HEIGHT, DISPLAY_WIDTH, DISPLAY_HEIGHT,
    MODEL_PATH, FOOD_MODEL_PATH, CONFIDENCE_THRESHOLD, IOU_THRESHOLD,
    DETECTION_COOLDOWN, BUFFER_SIZE, CONFIRM_THRESHOLD, FRAME_SKIP,
    ACTION_PROMPT_TIMEOUT, BARCODE_FRAME_SKIP,
)
from barcode_scanner import scan_barcode, lookup_product
from supabase_client import log_detection, cache_barcode, sync_offline_queue

# ---- CLI override for userId ----
parser = argparse.ArgumentParser(description="Smart Pantry Detector")
parser.add_argument("--user", type=str, default=USER_ID, help="Active user ID (default: from config.py)")
args = parser.parse_args()
ACTIVE_USER_ID = args.user
print(f"👤 Active User: {ACTIVE_USER_ID}")

# ===============================
# FOOD DATABASE (shelf life metadata)
# ===============================
FOOD_DB_PATH = os.path.join(os.path.dirname(__file__), "food_database.json")
food_db = []
if os.path.exists(FOOD_DB_PATH):
    with open(FOOD_DB_PATH, "r") as f:
        data = json.load(f)
        food_db = data.get("items", [])
    print(f"✅ Loaded {len(food_db)} food items from knowledge base")
else:
    print("⚠️  food_database.json not found — shelf life metadata unavailable")

def lookup_food_metadata(search_name):
    """Look up food metadata by name or keyword match."""
    search_lower = search_name.lower()
    for item in food_db:
        if item["name"].lower() == search_lower:
            return item
        if search_lower in [k.lower() for k in item.get("keywords", [])]:
            return item
    return None

# ===============================
# YOLOV8 MODEL INITIALIZATION
# ===============================
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    print("⚠️  ultralytics not installed. Run: pip install ultralytics")
    ULTRALYTICS_AVAILABLE = False

model = None
model_class_names = {}

def _load_model():
    global model, model_class_names
    # Prefer fine-tuned food model, fall back to generic YOLOv8n
    preferred = FOOD_MODEL_PATH if os.path.exists(FOOD_MODEL_PATH) else MODEL_PATH
    if not os.path.exists(preferred):
        print(f"⚠️  Model not found at {preferred}. Downloading yolov8n.pt...")
        # ultralytics auto-downloads yolov8n.pt from the internet on first use
        preferred = "yolov8n.pt"

    print(f"🔍 Loading model: {preferred}")
    model = YOLO(preferred)
    model_class_names = model.names  # dict: {0: 'person', 1: 'bicycle', ...}
    print(f"✅ YOLOv8 ready — {len(model_class_names)} classes")
    return True

if ULTRALYTICS_AVAILABLE:
    try:
        _load_model()
    except Exception as e:
        print(f"❌ YOLOv8 init failed: {e}")
        model = None

# Load the food-specific class whitelist (only detect these)
FOOD_CLASS_WHITELIST = set()
food_classes_path = os.path.join(os.path.dirname(__file__), "models", "food_classes.txt")
if os.path.exists(food_classes_path):
    with open(food_classes_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                FOOD_CLASS_WHITELIST.add(line.lower())
    print(f"🍎 Food whitelist loaded: {len(FOOD_CLASS_WHITELIST)} classes")

# ===============================
# CAMERA SETUP
# ===============================
def get_camera():
    """Open camera based on CAMERA_SOURCE config."""
    if CAMERA_SOURCE == "picamera":
        try:
            from picamera2 import Picamera2
            picam = Picamera2()
            config = picam.create_preview_configuration(main={"format": "RGB888", "size": (CAPTURE_WIDTH, CAPTURE_HEIGHT)})
            picam.configure(config)
            picam.start()
            print("✅ Raspberry Pi Camera online (picamera2)")
            return picam, "picamera"
        except Exception as e:
            print(f"⚠️  Pi camera failed ({e}), falling back to webcam")

    # Webcam fallback
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAPTURE_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAPTURE_HEIGHT)
        cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        cap.set(cv2.CAP_PROP_FOCUS, 40)
        print(f"✅ Webcam online (index {CAMERA_INDEX})")
        return cap, "webcam"

    # Auto-scan if index fails
    for i in range(5):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAPTURE_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAPTURE_HEIGHT)
            cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
            cap.set(cv2.CAP_PROP_FOCUS, 40)
            print(f"✅ Webcam online (auto-detected index {i})")
            return cap, "webcam"
        cap.release()

    print("❌ No camera found")
    return None, None

def read_frame(camera, cam_type):
    """Read a single BGR frame from the camera."""
    if cam_type == "picamera":
        frame = camera.capture_array()
        return True, frame
    else:
        return camera.read()

def release_camera(camera, cam_type):
    if cam_type == "picamera":
        camera.stop()
    else:
        camera.release()

# ===============================
# DETECTION STATE
# ===============================
detection_buffer = deque(maxlen=BUFFER_SIZE)
last_detected = None
last_detection_time = 0
frame_count = 0
persistent_boxes = []  # Keep last YOLO boxes for smooth display across skipped frames
barcode_lock = Lock()
barcode_inflight = set()
barcode_recent = {}

# ===============================
# USER ACTION PROMPT
# ===============================
def prompt_action(frame, item_name):
    """
    Overlay a prompt on the camera frame asking the user to ADD, REMOVE, or DISMISS.
    Waits ACTION_PROMPT_TIMEOUT seconds. Returns 'added', 'removed', or None.
    """
    deadline = time.time() + ACTION_PROMPT_TIMEOUT

    while time.time() < deadline:
        remaining = int(deadline - time.time())
        display = frame.copy()

        # Dark overlay
        overlay = display.copy()
        cv2.rectangle(overlay, (0, 0), (640, 480), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.5, display, 0.5, 0, display)

        # Prompt text
        cv2.putText(display, f"Detected: {item_name}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
        cv2.putText(display, f"[A] Add to pantry", (20, 140),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 100), 2)
        cv2.putText(display, f"[R] Remove from pantry", (20, 190),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 100, 255), 2)
        cv2.putText(display, f"[D] Dismiss", (20, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 180, 180), 2)
        cv2.putText(display, f"Auto-adding in {remaining}s...", (20, 290),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 50), 1)

        cv2.imshow("Smart Pantry Detector", display)
        key = cv2.waitKey(200) & 0xFF

        if key == ord('a') or key == ord('A'):
            return "added"
        elif key == ord('r') or key == ord('R'):
            return "removed"
        elif key == ord('d') or key == ord('D'):
            return None  # Dismiss

    return "added"  # Timeout default

# ===============================
# CONFIRMED DETECTION HANDLER
# ===============================
def process_confirmed_item(frame, item_name, confidence, detection_type="yolo", barcode=None, brand=None, product_image_url=None, storage_type="fridge"):
    """
    Called when a food item is confirmed by the camera.
    Does NOT write to pantry directly — only logs to detection_history
    with status='pending'. The frontend will show a popup and the user
    decides whether to add or remove the item.
    """
    global last_detected, last_detection_time

    curr_time = time.time()
    if item_name == last_detected and (curr_time - last_detection_time < DETECTION_COOLDOWN):
        return  # Cooldown — skip repeat

    last_detected = item_name
    last_detection_time = curr_time

    print(f"\n🚀 DETECTED: {item_name} ({confidence:.1%}) via {detection_type.upper()}")
    print(f"   → Logging to detection_history (pending user confirmation on frontend)")

    # Look up shelf life metadata so the frontend has everything it needs
    meta = lookup_food_metadata(item_name)
    category = meta["category"] if meta else "other"
    
    shelf_life = meta.get(f"shelf_life_{storage_type}_days") if meta else None
    if shelf_life is None and meta:
        shelf_life = meta.get("shelf_life_fridge_days", 7)
    if shelf_life is None:
        shelf_life = 7
        
    expiry = (datetime.now() + timedelta(days=shelf_life)).strftime("%Y-%m-%d")

    # Log detection event with status=pending — frontend will confirm.
    # Optional barcode metadata is only included for barcode detections.
    detection_payload = {
        "item_name": item_name,
        "confidence": confidence,
        "detection_type": detection_type,
        "action": "pending",
        "status": "pending",
        "user_id": ACTIVE_USER_ID,
        "category": category,
        "storage_type": storage_type,
        "shelf_life_days": shelf_life,
        "expiry_date": expiry,
    }
    if barcode:
        detection_payload["barcode"] = barcode
        detection_payload["barcode_data"] = barcode
    if brand:
        detection_payload["brand"] = brand
    if product_image_url:
        detection_payload["product_image_url"] = product_image_url

    log_detection(detection_payload)


def queue_barcode_detection(barcode_value):
    """
    Resolve barcode metadata and log the detection in a worker thread.
    Network/API/database work must not block the camera loop.
    """
    now = time.time()
    with barcode_lock:
        last_seen = barcode_recent.get(barcode_value, 0)
        if barcode_value in barcode_inflight or now - last_seen < DETECTION_COOLDOWN:
            return False
        barcode_inflight.add(barcode_value)

    def worker():
        try:
            product = lookup_product(barcode_value)
            if not product:
                print(f"⚠️  Barcode {barcode_value} not found in any database. Logged to barcode_misses.log for manual entry.")
                return

            resolved_barcode = product.get("lookup_barcode", barcode_value)
            cache_barcode({"barcode": resolved_barcode, "raw_barcode": barcode_value, **product})
            display_name = " ".join(
                part for part in [product.get("brand"), product.get("product_name")] if part
            ).strip()
            process_confirmed_item(
                None,
                display_name,
                0.99,
                detection_type="barcode",
                barcode=resolved_barcode,
                brand=product.get("brand"),
                product_image_url=product.get("image_url"),
            )
        except Exception as exc:
            print(f"❌ Barcode processing failed for {barcode_value}: {exc}")
        finally:
            with barcode_lock:
                barcode_inflight.discard(barcode_value)
                barcode_recent[barcode_value] = time.time()

    Thread(target=worker, daemon=True).start()
    return True

# ===============================
# MAIN DETECTION LOOP
# ===============================
def run_detector():
    global frame_count, persistent_boxes

    camera, cam_type = get_camera()
    if camera is None:
        print("❌ Cannot start — no camera available")
        return

    print("\n👁️  Smart Pantry Detector Running...")
    print(f"   Camera: {cam_type} | User: {ACTIVE_USER_ID} | Model: YOLOv8")
    print("   Press Q to quit\n")

    sync_offline_queue()
    last_sync_time = time.time()
    no_barcode_frames = 0

    try:
        while True:
            # Periodic offline queue sync
            if time.time() - last_sync_time > 60:
                sync_offline_queue()
                last_sync_time = time.time()

            ok, frame_hires = read_frame(camera, cam_type)
            if not ok or frame_hires is None:
                print("⚠️  Frame dropped — retrying...")
                time.sleep(0.5)
                continue

            frame_count += 1
            frame = cv2.resize(frame_hires, (DISPLAY_WIDTH, DISPLAY_HEIGHT))

            # ---- FAST PATH: Barcode scan (throttled) ----
            # Using downscaled `frame` instead of `frame_hires` to reduce CPU lag
            barcodes = scan_barcode(frame) if frame_count % BARCODE_FRAME_SKIP == 0 else []
            if barcodes:
                no_barcode_frames = 0
                b = barcodes[0]
                b_data = b["data"]
                bx, by, bw, bh = b["bbox"]

                # Scale bounding box back to high-res if we want, or just draw on the downscaled frame
                # Since we display `frame`, let's just draw on `frame`
                cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (0, 255, 0), 3)
                cv2.putText(frame, f"BARCODE: {b_data}", (bx, by - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                            
                queued = queue_barcode_detection(b_data)
                cv2.putText(
                    frame,
                    "Barcode queued" if queued else "Barcode already processing",
                    (10, 65),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (0, 255, 0),
                    2,
                )
                detection_buffer.clear()
            elif frame_count % BARCODE_FRAME_SKIP == 0:
                no_barcode_frames += 1

            if no_barcode_frames > 10:
                cx, cy = DISPLAY_WIDTH // 2, DISPLAY_HEIGHT // 2
                bw, bh = 300, 150
                cv2.rectangle(frame, (cx - bw//2, cy - bh//2), (cx + bw//2, cy + bh//2), (0, 150, 255), 2)
                cv2.putText(frame, "Scan Barcode Here", (cx - 70, cy - bh//2 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 150, 255), 1)

            # ---- SLOW PATH: YOLOv8 inference (every FRAME_SKIP frames) ----
            if not barcodes and model is not None and frame_count % FRAME_SKIP == 0:
                results = model.predict(
                    frame,
                    conf=CONFIDENCE_THRESHOLD,
                    iou=IOU_THRESHOLD,
                    verbose=False,
                )
                persistent_boxes = []

                if results and len(results) > 0:
                    boxes = results[0].boxes
                    if boxes is not None and len(boxes) > 0:
                        for box in boxes:
                            class_id = int(box.cls[0])
                            conf = float(box.conf[0])
                            class_name = model_class_names.get(class_id, "unknown").lower()

                            # Filter: only food classes
                            if class_name not in FOOD_CLASS_WHITELIST:
                                continue

                            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
                            persistent_boxes.append((x1, y1, x2, y2, class_name, conf))
                            detection_buffer.append((class_name, conf))

            # ---- Confirmation logic ----
            if len(detection_buffer) >= CONFIRM_THRESHOLD:
                names_only = [item[0] for item in detection_buffer]
                most_common, count = Counter(names_only).most_common(1)[0]
                if count >= CONFIRM_THRESHOLD:
                    max_conf = max(item[1] for item in detection_buffer if item[0] == most_common)
                    process_confirmed_item(frame, most_common, max_conf, detection_type="yolo")
                    detection_buffer.clear()

            # ---- Draw persistent boxes ----
            for (x1, y1, x2, y2, label, conf) in persistent_boxes:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 80, 0), 2)
                cv2.putText(frame, f"{label} {conf:.0%}", (x1, y1 - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 80, 0), 2)

            # ---- Status HUD ----
            cv2.putText(frame, f"User: {ACTIVE_USER_ID}", (10, 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            cv2.putText(frame, f"Cam: {cam_type}", (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            cv2.imshow("Smart Pantry Detector", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        print("\n⛔ Detector stopped by user")
    finally:
        release_camera(camera, cam_type)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run_detector()
