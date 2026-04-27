import os
import cv2
import time
import datetime
import numpy as np
import requests
from pyzbar.pyzbar import decode, ZBarSymbol

BARCODE_DEBUG = os.getenv("BARCODE_DEBUG", "0") == "1"
HTTP_TIMEOUT_SECONDS = 2.0
MAX_SCAN_WIDTH = 960

# Minimum consecutive frames the same barcode must appear before we trust it.
# Eliminates single-frame noise reads like "48185795" from curved bottles.
CONFIRM_FRAMES = 3

HTTP_SESSION = requests.Session()

# Cache dictionary to prevent repeated API calls
BARCODE_CACHE = {}

# Barcode cooldown tracker: { "barcode_str": timestamp }
BARCODE_COOLDOWN = {}
COOLDOWN_SECONDS = 3.0

# Multi-frame confirmation state: { "barcode_str": consecutive_hit_count }
_CANDIDATE_HITS: dict[str, int] = {}

_OPENCV_BARCODE_DETECTOR = None
_ZXINGCPP = None

# Miss log path — records barcodes that couldn't be looked up, for manual entry later
_MISS_LOG_PATH = os.path.join(os.path.dirname(__file__), "barcode_misses.log")


def _get_opencv_barcode_detector():
    global _OPENCV_BARCODE_DETECTOR
    if _OPENCV_BARCODE_DETECTOR is None and hasattr(cv2, "barcode"):
        _OPENCV_BARCODE_DETECTOR = cv2.barcode.BarcodeDetector()
    return _OPENCV_BARCODE_DETECTOR


def _get_zxingcpp():
    global _ZXINGCPP
    if _ZXINGCPP is None:
        try:
            import zxingcpp
            _ZXINGCPP = zxingcpp
        except Exception:
            _ZXINGCPP = False
    return _ZXINGCPP or None


def _center_crop(frame, ratio=1.0):
    h, w = frame.shape[:2]
    ch, cw = int(h * ratio), int(w * ratio)
    y1, x1 = (h - ch) // 2, (w - cw) // 2
    return frame[y1:y1+ch, x1:x1+cw], x1, y1


def _resize_for_scan(frame):
    h, w = frame.shape[:2]
    if w <= MAX_SCAN_WIDTH:
        return frame, 1.0
    scale = MAX_SCAN_WIDTH / float(w)
    resized = cv2.resize(frame, (MAX_SCAN_WIDTH, int(h * scale)), interpolation=cv2.INTER_AREA)
    return resized, scale


def _upc_check_digit(first_11_digits):
    odd_sum = sum(int(d) for d in first_11_digits[0::2])
    even_sum = sum(int(d) for d in first_11_digits[1::2])
    return str((10 - ((odd_sum * 3 + even_sum) % 10)) % 10)


def _expand_upce_digits(upce):
    """
    Expand UPC-E to UPC-A candidates. Some scanners return UPC-E as only the
    six compressed digits, so try number systems 0 and 1 when needed.
    """
    digits = "".join(ch for ch in str(upce) if ch.isdigit())
    if len(digits) == 8:
        number_system, core, check_digit = digits[0], digits[1:7], digits[7]
        systems = [(number_system, check_digit)]
    elif len(digits) == 7:
        core, check_digit = digits[:6], digits[6]
        systems = [("0", check_digit), ("1", check_digit)]
    elif len(digits) == 6:
        core = digits
        systems = [("0", None), ("1", None)]
    else:
        return []

    candidates = []
    for number_system, check_digit in systems:
        a, b, c, d, e, f = core
        if f in "012":
            upca_11 = f"{number_system}{a}{b}{f}0000{c}{d}{e}"
        elif f == "3":
            upca_11 = f"{number_system}{a}{b}{c}00000{d}{e}"
        elif f == "4":
            upca_11 = f"{number_system}{a}{b}{c}{d}00000{e}"
        else:
            upca_11 = f"{number_system}{a}{b}{c}{d}{e}0000{f}"

        computed_check = _upc_check_digit(upca_11)
        if check_digit is None or computed_check == check_digit:
            candidates.append(f"{upca_11}{computed_check}")

    return candidates


def _lookup_candidates(barcode):
    digits = "".join(ch for ch in str(barcode) if ch.isdigit())
    candidates = []

    if digits:
        candidates.append(digits)
        if len(digits) in {6, 7, 8}:
            candidates.extend(_expand_upce_digits(digits))
        if len(digits) < 12:
            candidates.append(digits.zfill(12))
        if len(digits) < 13:
            candidates.append(digits.zfill(13))

    seen = set()
    unique_candidates = []
    for candidate in candidates:
        if candidate and candidate not in seen:
            seen.add(candidate)
            unique_candidates.append(candidate)
    return unique_candidates or [barcode]


def _clean_text(value):
    if not value:
        return ""
    value = str(value).strip()
    return "" if value.lower() in {"unknown", "unknown product", "unknown brand"} else value


def _preprocess_for_barcode(frame):
    """
    Apply minimal preprocessing to improve barcode readability
    without causing significant lag.
    """
    candidates = []

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    candidates.append(gray)

    # One contrast-enhanced candidate helps low-light webcam frames without
    # paying the cost of several threshold/rotation passes on every scan.
    gray = cv2.equalizeHist(gray)
    candidates.append(gray)

    sharpen_kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    candidates.append(cv2.filter2D(gray, -1, sharpen_kernel))

    adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 21, 15
    )
    candidates.append(adaptive)

    candidates.append(cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC))

    return candidates


# -----------------------------------------------------------------------
# EAN/UPC FORMAT NAMES — these types must contain digits only
# -----------------------------------------------------------------------
_NUMERIC_ONLY_TYPES = {
    "EAN13", "EAN-13", "EAN8", "EAN-8",
    "UPCA", "UPC-A", "UPCE", "UPC-E",
    "I25",  # Interleaved 2-of-5 — purely numeric
}


def _is_valid_for_type(data: str, barcode_type: str) -> bool:
    """
    For EAN/UPC symbologies, reject reads that contain non-numeric characters.
    Code128 / Code39 are alphanumeric (e.g. IVM-1487-209320) — always pass.
    """
    if barcode_type.upper() in {t.upper() for t in _NUMERIC_ONLY_TYPES}:
        return data.isdigit()
    return True  # Code128, Code39, QR etc — allow alphanumeric


def scan_barcode(full_frame):
    """
    Detects barcodes/QR codes in an OpenCV frame.
    Uses pyzbar, OpenCV's built-in detectors, and zxingcpp.

    Returns list of barcode dicts that have now been seen CONFIRM_FRAMES
    consecutive times, or empty list if nothing is confirmed yet.
    """
    raw_results = []
    seen_data = set()

    frame, offset_x, offset_y = _center_crop(full_frame)
    frame, scan_scale = _resize_for_scan(frame)

    def map_bbox(x, y, w, h):
        return (
            int(x / scan_scale) + offset_x,
            int(y / scan_scale) + offset_y,
            int(w / scan_scale),
            int(h / scan_scale),
        )

    # 1. OpenCV Built-in Barcode Detector
    try:
        bd = _get_opencv_barcode_detector()
        retval, decoded_info, decoded_type, points = bd.detectAndDecode(frame) if bd else (False, [], [], None)
        if retval and decoded_info and points is not None:
            for i, info in enumerate(decoded_info):
                btype = str(decoded_type[i]) if decoded_type is not None and i < len(decoded_type) else "unknown"
                if info and info not in seen_data and _is_valid_for_type(info, btype):
                    seen_data.add(info)
                    pts = points[i].astype(int)
                    x, y, w, h = cv2.boundingRect(pts)
                    raw_results.append({
                        "data": info,
                        "type": btype,
                        "bbox": map_bbox(x, y, w, h)
                    })
    except Exception:
        pass

    # 2. zxing-cpp
    if not raw_results:
        try:
            zxingcpp = _get_zxingcpp()
            results_zx = zxingcpp.read_barcodes(frame) if zxingcpp else []
            for r in results_zx:
                btype = r.format.name if hasattr(r, "format") else "unknown"
                if r.text and r.text not in seen_data and _is_valid_for_type(r.text, btype):
                    seen_data.add(r.text)
                    try:
                        pts = np.array([
                            [r.position.top_left.x, r.position.top_left.y],
                            [r.position.top_right.x, r.position.top_right.y],
                            [r.position.bottom_right.x, r.position.bottom_right.y],
                            [r.position.bottom_left.x, r.position.bottom_left.y]
                        ])
                        x, y, w, h = cv2.boundingRect(pts)
                    except Exception:
                        h_f, w_f = frame.shape[:2]
                        x, y, w, h = 0, 0, w_f, h_f
                    raw_results.append({
                        "data": r.text,
                        "type": btype,
                        "bbox": map_bbox(x, y, w, h)
                    })
        except Exception:
            pass

    # 3. PyZbar fallback on multiple preprocessed images
    if not raw_results:
        symbologies = [
            ZBarSymbol.EAN13, ZBarSymbol.EAN8, ZBarSymbol.UPCA, ZBarSymbol.UPCE,
            ZBarSymbol.CODE128, ZBarSymbol.CODE39, ZBarSymbol.QRCODE, ZBarSymbol.I25
        ]
        for rot_frame, rotated in ((frame, False), (cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE), True)):
            candidates = _preprocess_for_barcode(rot_frame)
            for img in candidates:
                try:
                    detected_barcodes = decode(img, symbols=symbologies)
                except Exception:
                    continue

                if detected_barcodes:
                    for barcode in detected_barcodes:
                        barcode_data = barcode.data.decode("utf-8")
                        btype = barcode.type if hasattr(barcode, "type") else "unknown"
                        if barcode_data not in seen_data and _is_valid_for_type(barcode_data, btype):
                            seen_data.add(barcode_data)
                            if rotated:
                                h_f, w_f = frame.shape[:2]
                                bbox = map_bbox(0, 0, w_f, h_f)
                            else:
                                (x, y, w, h) = barcode.rect
                                bbox = map_bbox(x, y, w, h)
                            raw_results.append({
                                "data": barcode_data,
                                "type": btype,
                                "bbox": bbox
                            })
                    break
            if raw_results:
                break

    if BARCODE_DEBUG and not raw_results:
        cv2.imwrite(f"debug_failed_barcode_{int(time.time())}.jpg", frame)

    # -----------------------------------------------------------------------
    # Multi-frame confirmation gate
    # Increment hits for seen candidates; reset all others to 0.
    # Only return a result once it has been seen CONFIRM_FRAMES times in a row.
    # -----------------------------------------------------------------------
    seen_this_frame = {r["data"] for r in raw_results}

    # Decay candidates not seen this frame
    for key in list(_CANDIDATE_HITS.keys()):
        if key not in seen_this_frame:
            _CANDIDATE_HITS.pop(key, None)

    # Increment candidates seen this frame
    confirmed = []
    for r in raw_results:
        key = r["data"]
        _CANDIDATE_HITS[key] = _CANDIDATE_HITS.get(key, 0) + 1
        if _CANDIDATE_HITS[key] >= CONFIRM_FRAMES:
            confirmed.append(r)

    if not confirmed:
        return []

    # Apply cooldown to confirmed results
    current_time = time.time()
    filtered_results = []
    for r in confirmed:
        bdata = r["data"]
        last_seen = BARCODE_COOLDOWN.get(bdata, 0)
        if current_time - last_seen > COOLDOWN_SECONDS:
            BARCODE_COOLDOWN[bdata] = current_time
            _CANDIDATE_HITS.pop(bdata, None)  # Reset after firing
            filtered_results.append(r)

    return filtered_results


# -----------------------------------------------------------------------
# Barcode normalization — strip Indian brand prefixes before API lookup
# e.g. IVM-1487-209320  →  1487209320
#      MRP-500-012345   →  500012345
# -----------------------------------------------------------------------
def normalize_barcode(raw: str) -> str:
    """
    Strip known non-standard prefixes used by Indian brands so the numeric
    portion can be tried against Open Food Facts / UPC Item DB.
    """
    import re
    # Strip leading alphabetic prefix + dashes (e.g. "IVM-", "MRP-")
    normalized = re.sub(r"^[A-Za-z]+-", "", raw)
    # Remove remaining dashes
    normalized = normalized.replace("-", "")
    return normalized if normalized else raw


def mapOFFCategory(tags):
    if not tags:
        return "other"
    tag_str = str(tags).lower()
    if "en:milks" in tag_str or "dairy" in tag_str or "cheese" in tag_str:
        return "dairy"
    if "en:biscuits" in tag_str or "snack" in tag_str or "chips" in tag_str:
        return "snacks"
    if "en:beverages" in tag_str or "drink" in tag_str:
        return "beverages"
    if "fruit" in tag_str:
        return "fruits"
    if "vegetable" in tag_str:
        return "vegetables"
    if "meat" in tag_str or "poultry" in tag_str:
        return "meat_poultry"
    return "other"


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
        response = HTTP_SESSION.get(url, headers=headers, timeout=HTTP_TIMEOUT_SECONDS)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == 1:
                product = data.get("product", {})

                product_name = _clean_text(product.get("product_name") or product.get("generic_name"))
                brand = _clean_text(product.get("brands"))
                if not product_name:
                    return None

                info = {
                    "product_name": product_name,
                    "brand": brand,
                    "category": mapOFFCategory(product.get("categories_tags")),
                    "calories": product.get("nutriments", {}).get("energy-kcal_100g", 0),
                    "protein": product.get("nutriments", {}).get("proteins_100g", 0),
                    "fat": product.get("nutriments", {}).get("fat_100g", 0),
                    "carbs": product.get("nutriments", {}).get("carbohydrates_100g", 0),
                    "image_url": product.get("image_front_url", product.get("image_url", "")),
                    "serving_size": product.get("serving_size", ""),
                    "expiration_date": product.get("expiration_date", ""),
                    "source": "openfoodfacts",
                }
                BARCODE_CACHE[barcode] = info
                return info
    except Exception as e:
        print(f"Barcode lookup error: {e}")

    return None


def lookup_upc_itemdb(barcode):
    url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
    try:
        resp = HTTP_SESSION.get(url, timeout=HTTP_TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items", [])
            if items:
                item = items[0]
                product_name = _clean_text(item.get("title"))
                brand = _clean_text(item.get("brand"))
                if not product_name:
                    return None
                return {
                    "product_name": product_name,
                    "brand": brand,
                    "category": item.get("category", "other"),
                    "calories": 0,
                    "protein": 0,
                    "fat": 0,
                    "carbs": 0,
                    "image_url": item.get("images", [""])[0] if item.get("images") else "",
                    "serving_size": "",
                    "expiration_date": "",
                    "source": "upcitemdb",
                }
    except Exception as e:
        print(f"UPC Item DB lookup error: {e}")
    return None


def _log_miss(raw_barcode: str, candidates: list[str]) -> None:
    """
    Append a line to barcode_misses.log when no product is found for a barcode.
    Helps build a manual-entry backlog for Indian products.
    """
    try:
        timestamp = datetime.datetime.now().isoformat(timespec="seconds")
        line = f"{timestamp} | raw={raw_barcode} | candidates={candidates}\n"
        with open(_MISS_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass  # Never crash the detector over a log write


def lookup_product(barcode):
    from supabase_client import get_cached_barcode

    # Try both the raw barcode AND the normalized (prefix-stripped) version
    normalized = normalize_barcode(barcode)
    search_keys = list(dict.fromkeys([barcode, normalized]))  # deduplicated, order preserved

    all_candidates = []
    for key in search_keys:
        all_candidates.extend(_lookup_candidates(key))
    # Deduplicate while preserving order
    seen = set()
    candidates = [c for c in all_candidates if not (c in seen or seen.add(c))]

    for candidate in candidates:
        if candidate in BARCODE_CACHE:
            return BARCODE_CACHE[candidate]

        cached = get_cached_barcode(candidate)
        if cached:
            BARCODE_CACHE[candidate] = cached
            return cached

        product = lookup_open_food_facts(candidate)
        if not product:
            product = lookup_upc_itemdb(candidate)

        if product:
            product["lookup_barcode"] = candidate
            BARCODE_CACHE[candidate] = product
            BARCODE_CACHE[barcode] = product
            return product

    # Nothing found — log for manual follow-up
    _log_miss(barcode, candidates)
    return None
