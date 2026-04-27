# 🍎 Smart Pantry

Intelligent Food Management System powered by AI Vision and Cohere, built for Raspberry Pi.

## Features

- **📷 AI Food Detection** — YOLOv4-Tiny detects food items via USB camera
- **🥦 Nutrition Calculator** — USDA API-powered calorie & nutrient tracking
- **🥗 Personalized Diet Plans** — AI-generated meal plans based on health goals
- **📊 Health Reports** — Visual nutritional summary with progress bars
- **💬 Smart Chatbot** — AI assistant for food, nutrition & health queries
- **♻️ Gamified Waste Reduction** — Score, streaks & rewards for reducing waste
- **🤝 Food Donation Finder** — Find local NGOs and donation centers

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Flask (Python) |
| AI Chat | Cohere API (`command-r`) |
| Food Detection | YOLOv4-Tiny + OpenCV |
| Nutrition Data | USDA FoodData Central API |
| Database | SQLite |
| Frontend | HTML/CSS/Vanilla JS |
| Target Hardware | Raspberry Pi |

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/karanagg166/edpproject.git
cd edpproject

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download YOLO weights (~24MB)
wget https://github.com/AlexeyAB/darknet/releases/download/yolov4/yolov4-tiny.weights

# 5. Add your API keys
cp .env.example .env
# Edit .env with your Cohere and USDA keys

# 6. Run the app
python app.py
```

Open `http://localhost:5000` in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COHERE_API_KEY` | Your Cohere API key ([dashboard.cohere.com](https://dashboard.cohere.com)) |
| `USDA_API_KEY` | USDA FoodData Central key ([fdc.nal.usda.gov](https://fdc.nal.usda.gov/api-key-signup.html)) |

## License

MIT
