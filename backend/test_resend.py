import os
import resend
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, "venv", ".env")
load_dotenv(env_path)

def test_resend_email():
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("RESEND_API_KEY missing")
        return
        
    resend.api_key = api_key
    
    try:
        # Note: onboarding@resend.dev can only send to the email linked to the account
        # For this test, I assume the user's gmail seen in .env is the one.
        to_email = "raivadalokesh@gmail.com" # From user's previous .env or metadata
        
        params = {
            "from": "HireGen AI <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "Resend API Test",
            "html": "<strong>It works!</strong>",
        }
        
        response = resend.Emails.send(params)
        print("Successfully sent email via Resend API")
        print(response)
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_resend_email()
