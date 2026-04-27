# ===============================
# Smart Pantry — Configuration
# ===============================
# Edit this file to switch between webcam and Pi camera, and to set the active user.
import os
from dotenv import load_dotenv
load_dotenv()

# --- Camera Source ---
# "webcam"    → Use laptop/USB webcam via OpenCV (for testing)
# "picamera"  → Use Raspberry Pi Camera Module via picamera2 (for Pi deployment)
CAMERA_SOURCE = "webcam"
CAMERA_INDEX = 0        # Webcam device index (try 0, 1, 2 if camera not found)

# --- Camera Resolution ---
CAPTURE_WIDTH = 1280
CAPTURE_HEIGHT = 720
DISPLAY_WIDTH = 640
DISPLAY_HEIGHT = 480

# --- User Identity ---
# Read from .env as a device token. Set PANTRY_USER_ID in your .env file
# after a user registers on the portal. Override via CLI: python detector.py --user user_2
USER_ID = os.getenv("PANTRY_USER_ID", "user_1")

# --- ML Model ---
# Path to the YOLOv8 food model weights.
#
# Default: yolov8n-oiv7.pt (Open Images V7) — 601 classes, ~70 food classes
#   covers fruits, vegetables, packaged foods, drinks, and utensils.
#   Massively better than yolov8n.pt (COCO), which only has 10 food classes.
#
# Override: drop a fine-tuned food model at models/yolov8n-food.pt and it
# will be used instead.
#
# ultralytics auto-downloads either model on first use if not present locally.
MODEL_PATH = "models/yolov8n-oiv7.pt"        # default: Open Images V7 (601 classes)
FOOD_MODEL_PATH = "models/yolov8n-food.pt"   # food-specific (use if available)

# Confidence threshold for detections (0.0 - 1.0). Lower = more detections but more false positives.
# Open Images is a tougher dataset than COCO, so we drop the threshold a bit
# to catch more real food items in messy kitchen scenes.
CONFIDENCE_THRESHOLD = 0.40
IOU_THRESHOLD = 0.45

# --- Detection Logic ---
DETECTION_COOLDOWN = 10   # Seconds before the same item can be detected again
BUFFER_SIZE = 5           # Frames to buffer before confirming a detection
CONFIRM_THRESHOLD = 4     # Minimum buffer hits to confirm an item
FRAME_SKIP = 5            # Run inference every N frames (increased for performance)
BARCODE_FRAME_SKIP = 10   # Scan barcode every N frames to keep camera preview responsive

# --- User Prompt Timeout ---
# Seconds to wait for A/R/D keypress after detection. After timeout, action defaults to ADD.
ACTION_PROMPT_TIMEOUT = 10
