"""
Smart Pantry — Supabase Client
Handles all database operations with user_id scoping and an offline SQLite fallback queue.
"""
from __future__ import annotations
import os
import sqlite3
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", "")).strip()

LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "offline_queue.db")


def _init_local_queue():
    conn = sqlite3.connect(LOCAL_DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS offline_pantry_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            storage_type TEXT,
            shelf_life_days INTEGER,
            expiry_date TEXT,
            added_by TEXT,
            user_id TEXT DEFAULT 'user_1',
            action TEXT DEFAULT 'added'
        )
    """)
    conn.commit()
    conn.close()


_init_local_queue()


def get_supabase() -> Optional[Client]:
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            return create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"⚠️  Supabase connect failed: {e}")
    return None


# ===============================
# ADD ITEM TO PANTRY
# ===============================
def add_to_pantry(item_data: dict) -> bool:
    """
    Upserts an item into the pantry table.
    If the item already exists for this user, increments quantity by 1.
    Falls back to local SQLite queue if Supabase is unreachable.
    """
    client = get_supabase()
    user_id = item_data.get("user_id", "user_1")
    name = item_data.get("name", "")

    if client:
        try:
            # Check if item already exists for this user
            existing = (
                client.table("pantry")
                .select("id, quantity")
                .eq("user_id", user_id)
                .ilike("name", name)
                .execute()
            )
            if existing.data:
                row = existing.data[0]
                client.table("pantry").update(
                    {"quantity": row["quantity"] + 1}
                ).eq("id", row["id"]).execute()
                print(f"☁️  Updated qty for {name} (user: {user_id})")
            else:
                client.table("pantry").insert(item_data).execute()
                print(f"☁️  Added {name} to pantry (user: {user_id})")
            return True
        except Exception as e:
            print(f"❌ Supabase add_to_pantry failed: {e}")

    # Offline fallback
    print(f"⚠️  Offline — queuing: {name}")
    _queue_offline(item_data, action="added")
    return False


# ===============================
# REMOVE ITEM FROM PANTRY
# ===============================
def remove_from_pantry(item_data: dict, user_id: str) -> bool:
    """
    Decrements quantity of an item by 1. Deletes the row if quantity reaches 0.
    """
    client = get_supabase()
    name = item_data.get("name", "")

    if client:
        try:
            existing = (
                client.table("pantry")
                .select("id, quantity")
                .eq("user_id", user_id)
                .ilike("name", name)
                .execute()
            )
            if existing.data:
                row = existing.data[0]
                if row["quantity"] <= 1:
                    client.table("pantry").delete().eq("id", row["id"]).execute()
                    print(f"🗑️  Deleted {name} from pantry (user: {user_id})")
                else:
                    client.table("pantry").update(
                        {"quantity": row["quantity"] - 1}
                    ).eq("id", row["id"]).execute()
                    print(f"⬇️  Decremented {name} qty (user: {user_id})")
                return True
            else:
                print(f"⚠️  {name} not found in pantry for user {user_id}")
                return False
        except Exception as e:
            print(f"❌ Supabase remove_from_pantry failed: {e}")

    _queue_offline(item_data, action="removed")
    return False


# ===============================
# LOG DETECTION EVENT
# ===============================
def log_detection(detection_data: dict) -> None:
    """
    Inserts a row into detection_history table.
    Includes action ('added' or 'removed') and user_id.
    """
    client = get_supabase()
    if client:
        try:
            # Ensure table name is detection_history (after migration)
            client.table("detection_history").insert(detection_data).execute()
            action = detection_data.get("action", "detected")
            print(f"📡 Logged: {detection_data.get('item_name')} ({action})")
        except Exception as e:
            print(f"⚠️ log_detection failed with full payload: {e}. Retrying base fields...")
            try:
                base_detection = {
                    key: value
                    for key, value in detection_data.items()
                    if key in {
                        "item_name",
                        "confidence",
                        "detection_type",
                        "action",
                        "status",
                        "user_id",
                        "category",
                        "storage_type",
                        "shelf_life_days",
                        "expiry_date",
                    }
                }
                client.table("detection_history").insert(base_detection).execute()
                action = base_detection.get("action", "detected")
                print(f"📡 Logged without optional barcode fields: {base_detection.get('item_name')} ({action})")
            except Exception as retry_e:
                print(f"❌ log_detection failed completely: {retry_e}")


# ===============================
# CACHE BARCODE
# ===============================
def cache_barcode(barcode_data: dict) -> None:
    client = get_supabase()
    if client:
        try:
            client.table("barcode_cache").upsert(barcode_data).execute()
        except Exception as e:
            print(f"⚠️  cache_barcode failed: {e}")

def get_cached_barcode(barcode: str) -> Optional[dict]:
    client = get_supabase()
    if client:
        try:
            result = client.table("barcode_cache").select("*").eq("barcode", barcode).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"⚠️  get_cached_barcode failed: {e}")
    return None


# ===============================
# OFFLINE QUEUE HELPERS
# ===============================
def _queue_offline(item_data: dict, action: str = "added") -> None:
    conn = sqlite3.connect(LOCAL_DB_PATH)
    conn.execute(
        """INSERT INTO offline_pantry_queue
           (name, category, storage_type, shelf_life_days, expiry_date, added_by, user_id, action)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            item_data.get("name"),
            item_data.get("category"),
            item_data.get("storage_type"),
            item_data.get("shelf_life_days"),
            item_data.get("expiry_date"),
            item_data.get("added_by", "camera"),
            item_data.get("user_id", "user_1"),
            action,
        ),
    )
    conn.commit()
    conn.close()


def sync_offline_queue() -> None:
    """Retry all offline-queued items against Supabase."""
    client = get_supabase()
    if not client:
        return

    conn = sqlite3.connect(LOCAL_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, category, storage_type, shelf_life_days, expiry_date, added_by, user_id, action "
        "FROM offline_pantry_queue"
    )
    rows = cursor.fetchall()

    if rows:
        print(f"🔄 Syncing {len(rows)} offline items...")

    success_ids = []
    for row in rows:
        item = {
            "name": row[1], "category": row[2], "storage_type": row[3],
            "shelf_life_days": row[4], "expiry_date": row[5],
            "user_id": row[7],
        }
        action = row[8]
        try:
            if action == "removed":
                remove_from_pantry(item, row[7])
            else:
                client.table("pantry").upsert(item).execute()
            success_ids.append(row[0])
        except Exception:
            pass

    if success_ids:
        placeholders = ",".join(["?"] * len(success_ids))
        conn.execute(f"DELETE FROM offline_pantry_queue WHERE id IN ({placeholders})", success_ids)
        conn.commit()
        print(f"✅ Synced {len(success_ids)} items")

    conn.close()
