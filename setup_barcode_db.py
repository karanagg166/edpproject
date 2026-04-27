import os
import sys
from dotenv import load_dotenv

load_dotenv()
load_dotenv("smart-pantry-web/.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", "")).strip()
DB_PASSWORD = os.getenv("DATABASE_PASSWORD", "").strip()

project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

sql = """
CREATE TABLE IF NOT EXISTS public.barcode_cache (
    barcode TEXT PRIMARY KEY,
    raw_barcode TEXT,
    product_name TEXT,
    brand TEXT,
    category TEXT,
    calories INTEGER,
    protein INTEGER,
    fat INTEGER,
    carbs INTEGER,
    image_url TEXT,
    serving_size TEXT,
    expiration_date TEXT,
    lookup_barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.barcode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.barcode_cache
    FOR SELECT USING (true);

-- Run the migration for detection_history as well
ALTER TABLE public.detection_history
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS barcode_data TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS product_image_url TEXT;
"""

try:
    import psycopg2
except ImportError:
    os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
    import psycopg2

passwords = [p for p in [DB_PASSWORD, SERVICE_KEY] if p]
hosts = [
    (f"aws-0-ap-south-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    (f"aws-0-us-east-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    (f"aws-0-us-west-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    (f"aws-0-eu-west-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    (f"aws-0-ap-southeast-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    (f"db.{project_ref}.supabase.co", 5432, "postgres"),
    (f"{project_ref}.supabase.co", 5432, "postgres"),
]

conn = None
for password in passwords:
    if conn: break
    for host, port, user in hosts:
        try:
            conn = psycopg2.connect(
                host=host, port=port, database="postgres",
                user=user, password=password,
                sslmode="require", connect_timeout=5,
            )
            print("✅ Connected!")
            break
        except Exception:
            pass

if not conn:
    print("❌ Could not connect")
    sys.exit(1)

conn.autocommit = True
cur = conn.cursor()
try:
    cur.execute(sql)
    print("✅ Created barcode_cache and modified detection_history successfully")
except Exception as e:
    print(f"❌ DB update error: {e}")

cur.close()
conn.close()
