import os
from supabase import create_client, Client
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, "venv", ".env"))

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)

try:
    res = supabase.table("history").select("*").eq("user_id", "raivadalokesh@gmail.com").order("created_at", desc=True).limit(10).execute()
    print("Select Result:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
