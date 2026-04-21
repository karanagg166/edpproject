# Smart Pantry

Smart Pantry is an intelligent AI-powered application designed to run on Raspberry Pi (and other platforms) to help you manage your food, reduce waste, get diet plans, and find food donation centers.

## Prerequisites

- **Python 3.8+**
- **Git**
- Optional: USB Webcam

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd myproject
```

### 2. Set up Python Virtual Environment
**macOS / Linux / Raspberry Pi:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Download YOLOv4-tiny Weights
The AI detection relies on a pre-trained YOLOv4-tiny model.
Download the weights file (`yolov4-tiny.weights` ~23MB) and place it in the root folder of the project alongside `yolov4-tiny.cfg`.

*   **Linux/macOS/Raspberry Pi:** `wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights`
*   **Windows:** You can download it directly from your browser by pasting the URL above, and move the file into the project folder.

### 5. Configure API Keys
1. Copy the example environment file:
   * Mac/Linux/Pi: `cp .env.example .env`
   * Windows: `copy .env.example .env`
2. Open `.env` in a text editor.
3. Add your **Cohere API Key**. You can get one for free at [Cohere Dashboard](https://dashboard.cohere.com/).
4. The USDA API key is already provided for nutritional data.

### 6. Connect Camera
If you plan to use auto-detection, plug in your USB webcam. The app handles missing cameras gracefully and will just disable the camera features if none is found.

### 7. Run the Application
```bash
python app.py
```
Open a web browser and go to: `http://localhost:5000`

## Troubleshooting

*   **Camera not working:** The app tries `cv2.CAP_V4L2` by default. If you are on Mac/Windows and the camera doesn't open, open `app.py`, go to `get_camera()`, and change `cv2.VideoCapture(i, cv2.CAP_V4L2)` to simply `cv2.VideoCapture(i)`.
*   **Missing YOLO weights:** You will see a warning in the console on startup, and camera features will be disabled. Ensure the `yolov4-tiny.weights` file is exactly named that and in the main directory.
*   **Database issues:** SQLite DB (`smart_pantry.db`) is generated automatically. If things get corrupted, you can safely delete the `.db` file and restart the app to reset everything.
