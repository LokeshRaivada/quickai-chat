import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

def test_send_email():
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    
    print(f"Testing with: {email_user} on Port 465 (SSL)")
    
    msg = MIMEMultipart()
    msg['From'] = email_user
    msg['To'] = email_user
    msg['Subject'] = "SMTP SSL Test"
    msg.attach(MIMEText("Test message content", 'plain'))
    
    context = ssl.create_default_context()
    
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context)
        server.set_debuglevel(1)
        server.login(email_user, email_pass)
        server.send_message(msg)
        server.quit()
        print("Test Email Sent Successfully via SSL")
    except Exception as e:
        print(f"FAILED to send email via SSL: {e}")

if __name__ == "__main__":
    test_send_email()
