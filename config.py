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
# Download a food-specific model from Roboflow or use the generic yolov8n.pt.
MODEL_PATH = "models/yolov8n.pt"          # fallback: generic COCO model
FOOD_MODEL_PATH = "models/yolov8n-food.pt"  # food-specific (use if available)

# Confidence threshold for detections (0.0 - 1.0). Lower = more detections but more false positives.
CONFIDENCE_THRESHOLD = 0.60
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
