import os
import sys
from dotenv import load_dotenv

# Load different env files for testing
def test_connections():
    print("------- SMART PANTRY CONNECTION TEST -------")
    
    # 1. Test Backend Supabase Connection
    print("\n[1] Testing Python Backend Supabase Keys...")
    load_dotenv(dotenv_path=".env", override=True)
    
    py_url = os.getenv("SUPABASE_URL")
    py_key = os.getenv("SUPABASE_KEY")
    
    if not py_url or not py_key:
        print("❌ FAILED: Missing Supabase keys in .env")
    else:
        try:
            from supabase import create_client
            sb = create_client(py_url, py_key)
            # Just test fetching an empty list from pantry
            res = sb.table("pantry").select("*").limit(1).execute()
            print(f"✅ SUCCESS: Connected to Supabase DB successfully! Data: {res.data}")
        except Exception as e:
            print(f"❌ FAILED: Supabase Error: {str(e)}")

    # 2. Test Frontend Cohere AI Connection
    print("\n[2] Testing Next.js Frontend Cohere Key...")
    load_dotenv(dotenv_path="smart-pantry-web/.env.local", override=True)
    
    cohere_key = os.getenv("COHERE_API_KEY")
    if not cohere_key or cohere_key == "your_cohere_key":
        print("❌ FAILED: Missing Cohere key in .env.local")
    else:
        try:
            import cohere
            co = cohere.Client(api_key=cohere_key)
            response = co.chat(message="Say 'hello' in exactly one word.")
            print(f"✅ SUCCESS: Connected to Cohere AI! Response: {response.text.strip()}")
        except Exception as e:
            print(f"❌ FAILED: Cohere Error: {str(e)}")

    print("\n-------------------------------------------")

if __name__ == "__main__":
    test_connections()
