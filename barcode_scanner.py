import cv2
import numpy as np
import requests
from pyzbar.pyzbar import decode, ZBarSymbol

# Cache dictionary to prevent repeated API calls
BARCODE_CACHE = {}

def _preprocess_for_barcode(frame):
    """
    Apply multiple preprocessing techniques to improve barcode readability.
    Returns a list of processed frames to attempt decoding on.
    """
    candidates = []

    # 1. Original (always try first — fastest)
    candidates.append(frame)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # 2. Plain grayscale
    candidates.append(gray)

    # 3. High-contrast grayscale via CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    candidates.append(enhanced)

    # 4. Sharpened grayscale — helps with slightly blurry camera feeds
    sharpen_kernel = np.array([[0, -1, 0],
                               [-1,  5, -1],
                               [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, sharpen_kernel)
    candidates.append(sharpened)

    # 5. Adaptive threshold — excellent for uneven lighting conditions
    adaptive = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 15
    )
    candidates.append(adaptive)

    # 6. Otsu binarization — great for high-contrast barcodes
    _, otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    candidates.append(otsu)

    # 7. Upscaled 2x — helps with very small or distant barcodes
    upscaled = cv2.resize(enhanced, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    candidates.append(upscaled)

    return candidates


def scan_barcode(frame):
    """
    Detects barcodes/QR codes in an OpenCV frame using multi-pass preprocessing.
    Tries multiple image processing pipelines and returns results from the first
    pipeline that successfully decodes a barcode.
    
    Returns list of barcode dicts, or empty list if nothing found.
    """
    candidates = _preprocess_for_barcode(frame)

    # Accepted symbologies — all common 1D and 2D barcode types
    symbologies = [
        ZBarSymbol.EAN13,
        ZBarSymbol.EAN8,
        ZBarSymbol.UPCA,
        ZBarSymbol.UPCE,
        ZBarSymbol.CODE128,
        ZBarSymbol.CODE39,
        ZBarSymbol.QRCODE,
        ZBarSymbol.I25,       # Interleaved 2 of 5
        ZBarSymbol.DATABAR,
    ]

    for img in candidates:
        try:
            detected_barcodes = decode(img, symbols=symbologies)
        except Exception:
            # Some processed frames might cause issues, skip them
            continue

        if detected_barcodes:
            results = []
            seen_data = set()  # Deduplicate within the same frame
            for barcode in detected_barcodes:
                barcode_data = barcode.data.decode("utf-8")
                if barcode_data in seen_data:
                    continue
                seen_data.add(barcode_data)

                (x, y, w, h) = barcode.rect
                results.append({
                    "data": barcode_data,
                    "type": barcode.type,
                    "bbox": (x, y, w, h)
                })
            if results:
                return results

    return []


def lookup_open_food_facts(barcode):
    """
    Looks up barcode on Open Food Facts API (Free, no API key).
    Returns dict with product info if found, else None.
    """
    if barcode in BARCODE_CACHE:
        return BARCODE_CACHE[barcode]

    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    headers = {
        "User-Agent": "SmartPantryApp/2.0 (student@example.com)"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == 1:
                product = data.get("product", {})
                
                info = {
                    "product_name": product.get("product_name", "Unknown Product"),
                    "brand": product.get("brands", "Unknown Brand"),
                    "category": "packaged_snacks", # default
                    "calories": product.get("nutriments", {}).get("energy-kcal_100g", 0),
                    "protein": product.get("nutriments", {}).get("proteins_100g", 0),
                    "fat": product.get("nutriments", {}).get("fat_100g", 0),
                    "carbs": product.get("nutriments", {}).get("carbohydrates_100g", 0),
                    "image_url": product.get("image_url", "")
                }
                BARCODE_CACHE[barcode] = info
                return info
    except Exception as e:
        print(f"Barcode lookup error: {e}")
        
    BARCODE_CACHE[barcode] = None
    return None
