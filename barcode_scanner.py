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
    Detects barcodes/QR codes in an OpenCV frame.
    Uses pyzbar and OpenCV's built-in detectors for maximum reliability.
    Returns list of barcode dicts, or empty list if nothing found.
    """
    results = []
    seen_data = set()
    
    # 1. OpenCV Built-in Barcode Detector
    try:
        bd = cv2.barcode.BarcodeDetector()
        retval, decoded_info, decoded_type, points = bd.detectAndDecode(frame)
        if retval and len(decoded_info) > 0:
            for i, info in enumerate(decoded_info):
                if info and info not in seen_data:
                    seen_data.add(info)
                    pts = points[i].astype(int)
                    x, y, w, h = cv2.boundingRect(pts)
                    results.append({
                        "data": info,
                        "type": "barcode",
                        "bbox": (x, y, w, h)
                    })
    except Exception as e:
        pass

    # 2. OpenCV Built-in QR Detector
    try:
        qr = cv2.QRCodeDetector()
        retval, decoded_info, points, _ = qr.detectAndDecodeMulti(frame)
        if retval and len(decoded_info) > 0:
            for i, info in enumerate(decoded_info):
                if info and info not in seen_data:
                    seen_data.add(info)
                    pts = points[i].astype(int)
                    x, y, w, h = cv2.boundingRect(pts)
                    results.append({
                        "data": info,
                        "type": "qrcode",
                        "bbox": (x, y, w, h)
                    })
    except Exception as e:
        pass

    # 3. PyZbar fallback on multiple preprocessed images
    if not results:
        candidates = _preprocess_for_barcode(frame)
        symbologies = [
            ZBarSymbol.EAN13, ZBarSymbol.EAN8, ZBarSymbol.UPCA, ZBarSymbol.UPCE,
            ZBarSymbol.CODE128, ZBarSymbol.CODE39, ZBarSymbol.QRCODE, ZBarSymbol.I25
        ]
        
        for img in candidates:
            try:
                detected_barcodes = decode(img, symbols=symbologies)
            except Exception:
                continue

            if detected_barcodes:
                for barcode in detected_barcodes:
                    barcode_data = barcode.data.decode("utf-8")
                    if barcode_data not in seen_data:
                        seen_data.add(barcode_data)
                        (x, y, w, h) = barcode.rect
                        results.append({
                            "data": barcode_data,
                            "type": barcode.type,
                            "bbox": (x, y, w, h)
                        })
                if results:
                    break
                    
    return results


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
