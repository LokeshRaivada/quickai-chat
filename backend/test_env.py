import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "venv", ".env"))
print("URL:", os.getenv("SUPABASE_URL"))
print("KEY:", os.getenv("SUPABASE_KEY"))
