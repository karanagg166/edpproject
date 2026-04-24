# Smart Pantry

Smart Pantry is an intelligent AI-powered application designed to run on Raspberry Pi (and other platforms) to help you manage your food, reduce waste, get diet plans, and find food donation centers.

## Prerequisites

- **Node.js (v18+)** (for the frontend dashboard)
- **Git**
- **System package `libzbar0`** (for barcode scanning)
  - Ubuntu/Debian/Pi: `sudo apt-get install libzbar0`
  - macOS: `brew install zbar`
  - Windows: Automatically included in python `pyzbar` wheel.
- Optional: USB Webcam

## Setup Instructions

### 1. Setup Supabase (Cloud Database)
1. Sign up at [supabase.com](https://supabase.com).
2. Create a project and get your **Project URL**, **Anon Key**, and **Service Role Key**.
3. Use the SQL Editor in Supabase to create your tables (pantry, detections, barcode_cache). Turn on Realtime via Database -> Replication.

### 2. Configure Python Detection Service (Raspberry Pi / Laptop)
1. Copy `.env.example` to `.env` and fill it out:
   `NEXT_PUBLIC_SUPABASE_URL=...`
   `SUPABASE_SERVICE_ROLE_KEY=...`
2. Prepare virtual env:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start the Hardware Detection Loop
```bash
python detector.py
```
*This is fully headless (no UI) and will indefinitely scan the camera, pushing items to Supabase.*

### 4. Setup the Next.js Real-time Dashboard
In a new terminal window:
```bash
cd smart-pantry-web
npm install
npm run dev
```
Open `http://localhost:3000`. You will see the sleek, Vercel-ready dashboard that updates over WebSockets natively via Supabase the moment your Python script sees food.

### 4. Download YOLOv4-tiny Weights
The AI detection relies on a pre-trained YOLOv4-tiny model.
Download the weights file (`yolov4-tiny.weights` ~23MB) and place it in the root folder of the project alongside `yolov4-tiny.cfg`.

*   **Linux/macOS/Raspberry Pi:** `wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights`
*   **Windows:** You can download it directly from your browser by pasting the URL above, and move the file into the project folder.

### 5. Configure API Keys
1. API keys for Cohere and other web services should now be configured in the Next.js frontend directory (`smart-pantry-web/.env.local`).
2. Follow the Next.js frontend `.env.example` if available.

### 6. Connect Camera
If you plan to use auto-detection, plug in your USB webcam. Ensure your terminal has Camera permissions (especially on macOS).

## Troubleshooting

*   **Camera not working/dropping frames:** If you are on macOS and see "Camera frame dropped", this is usually because your terminal app (Terminal, iTerm, or VS Code) does not have Camera permissions. Go to **System Settings > Privacy & Security > Camera** and grant access to your terminal.
*   **Missing YOLO weights:** You will see a warning in the console on startup. Ensure the `yolov4-tiny.weights` file is exactly named that and is in the root directory.
*   **Database issues:** The detector pushes directly to Supabase now. If offline queue gets corrupted, you can safely delete `offline_queue.db` to reset the queue.
