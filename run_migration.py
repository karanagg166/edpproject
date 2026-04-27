"""
Run the SQL migration against Supabase.
Tries multiple connection methods in order:
  1. Direct Postgres connection (multiple hostname formats)
  2. DATABASE_URL from env
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()
load_dotenv("smart-pantry-web/.env.local")

SUPABASE_URL = os.getenv(
    "NEXT_PUBLIC_SUPABASE_URL", os.getenv("SUPABASE_URL", "")
).strip()
SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", "")
).strip()
DB_PASSWORD = os.getenv("DATABASE_PASSWORD", "").strip()

project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
print(f"📦 Project ref: {project_ref}")

# Read migration SQL
with open("migrations/v5_add_nutritional_data.sql", "r") as f:
    full_sql = f.read()

# Parse into individual statements
statements = []
current = []
in_do_block = False
for line in full_sql.split("\n"):
    stripped = line.strip()
    if stripped.startswith("--") or stripped == "":
        continue
    if stripped.startswith("DO $$"):
        in_do_block = True
    current.append(line)
    if in_do_block and stripped.startswith("END $$"):
        in_do_block = False
        statements.append("\n".join(current))
        current = []
    elif not in_do_block and stripped.endswith(";"):
        statements.append("\n".join(current))
        current = []
if current:
    statements.append("\n".join(current))

print(f"📝 {len(statements)} SQL statements to execute\n")

# Install psycopg2 if needed
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
    import psycopg2

# Try multiple connection patterns
passwords = [p for p in [DB_PASSWORD, SERVICE_KEY] if p]
hosts = [
    # New Supabase format (most common now)
    ("aws-0-ap-south-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    ("aws-0-us-east-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    ("aws-0-us-west-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    ("aws-0-eu-west-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    ("aws-0-ap-southeast-1.pooler.supabase.com", 6543, f"postgres.{project_ref}"),
    # Old format
    (f"db.{project_ref}.supabase.co", 5432, "postgres"),
    # Direct connection format
    (f"{project_ref}.supabase.co", 5432, "postgres"),
]

conn = None
for password in passwords:
    if conn:
        break
    pw_preview = password[:8] + "..." if len(password) > 8 else password
    for host, port, user in hosts:
        print(f"  Trying {user}@{host}:{port} (pass: {pw_preview})...", end=" ")
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                database="postgres",
                user=user,
                password=password,
                sslmode="require",
                connect_timeout=5,
            )
            print("✅ Connected!")
            break
        except Exception as e:
            err = str(e).split("\n")[0][:60]
            print(f"❌ {err}")

if not conn:
    print("\n" + "=" * 60)
    print("❌ Could not connect to Supabase PostgreSQL directly.")
    print("\nYou need to provide your DATABASE PASSWORD.")
    print("\nHow to find it:")
    print("  1. Go to https://supabase.com/dashboard")
    print("  2. Open your project → Settings → Database")
    print("  3. Copy the 'Database password'")
    print("  4. Run this command:\n")
    print('     DATABASE_PASSWORD="your_password_here" python run_migration.py\n')
    print("  Or add to your .env file:")
    print("     DATABASE_PASSWORD=your_password_here")
    print("=" * 60)
    sys.exit(1)

# Execute statements
conn.autocommit = True
cur = conn.cursor()
success = 0
errors = 0

for i, stmt in enumerate(statements, 1):
    stmt = stmt.strip()
    if not stmt:
        continue
    preview = stmt.replace("\n", " ")[:80]
    print(f"  [{i}/{len(statements)}] {preview}...")
    try:
        cur.execute(stmt)
        try:
            result = cur.fetchall()
            if result:
                print(f"    → {result}")
        except Exception:
            pass
        success += 1
    except Exception as e:
        err_msg = str(e).strip()
        if "already exists" in err_msg or "already member" in err_msg:
            print("    → (skipped: already exists)")
            success += 1
        else:
            print(f"    ❌ {err_msg}")
            errors += 1

cur.close()
conn.close()

print(
    f"\n{'✅' if errors == 0 else '⚠️'} Migration done: {success} succeeded, {errors} failed"
)
