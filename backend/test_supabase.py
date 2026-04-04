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
    content = [{"demo": 123}]
    entry = {
        "user_id": "raivadalokesh@gmail.com",
        "type": "planner",
        "title": "Study Plan",
        "content": content if isinstance(content, dict) else {"data": str(content)}
    }
    res = supabase.table("history").insert(entry).execute()
    with open("error.txt", "w") as f:
        f.write("Success")
except Exception as e:
    with open("error.txt", "w") as f:
        f.write(str(e))
