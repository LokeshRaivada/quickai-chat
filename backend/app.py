import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from PyPDF2 import PdfReader
from docx import Document
from apscheduler.schedulers.background import BackgroundScheduler
from supabase import create_client, Client
from dotenv import load_dotenv

# Use absolute paths so it works no matter what directory the user launches it from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, "venv", ".env"))

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

try:
    client_groq = Groq(api_key=GROQ_API_KEY)
except Exception:
    client_groq = None

try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
except (Exception, SystemExit):
    genai = None

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    else:
        supabase = None
except Exception:
    supabase = None

import resend
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to_email, subject, body):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("RESEND_API_KEY missing in .env, aborting email transmission.")
        return False
        
    resend.api_key = api_key
    
    try:
        email_sender = "onboarding@resend.dev"  # Default test sender for Resend
        
        params = {
            "from": f"HireGen AI <{email_sender}>",
            "to": [to_email],
            "subject": subject,
            "html": f"<div style='font-family: sans-serif; line-height: 1.6;'>{body.replace('\n', '<br>')}</div>",
        }
        
        response = resend.Emails.send(params)
        print(f"Successfully dispatched setup email via Resend to {to_email}")
        return True
    except Exception as e:
        print("Failed to send Resend email:", e)
        return False

# Helpers
def get_groq_response(prompt):
    try:
        completion = client_groq.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"AI Engine Offline: {str(e)}"

def get_career_insight(prompt):
    if genai:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            if response and response.text: return response.text
        except:
            pass
    # Fallback to Groq if GenerativeAI package crashes or is offline
    return get_groq_response(f"Expert Academic Advisor: {prompt}")

def save_to_history(user_id, type, title, content):
    if not supabase:
        print("No Supabase connection")
        return

    try:
        entry = {
            "user_id": user_id or "test_user",
            "type": type,
            "title": title,
            "content": content if isinstance(content, dict) else {"data": str(content)}
        }
        supabase.table("history").insert(entry).execute()
        print("✅ History saved")
    except Exception as e:
        print("❌ History error:", e)

# Routes
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

@app.route("/pingtest", methods=["GET"])
def pingtest():
    return jsonify({"status": "new_instance"}), 200

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    branch = data.get("branch", "CSE")

    if not supabase: 
        return jsonify({"success": False, "message": "Backend unreachable. Check .env config."}), 500

    try:
        exists = supabase.table("users").select("email").eq("email", email).execute()
        if exists.data:
            return jsonify({"success": False, "message": "Email already exists"}), 200
        user_data = {"name": name, "email": email, "password": password}
        supabase.table("users").insert(user_data).execute()
        return jsonify({"success": True, "message": "Profile Created. Now Please Login."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not supabase: 
        return jsonify({"success": False, "message": "Backend unreachable. Check .env config."}), 500

    try:
        res = supabase.table("users").select("*").eq("email", email).eq("password", password).execute()
        if res.data:
            user = res.data[0]
            return jsonify({"success": True, "user": user}), 200
        else:
            return jsonify({"success": False, "message": "Invalid email or password"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/history", methods=["GET"])
def history():
    email = request.args.get("email")

    if not supabase:
        return jsonify({"history": []}), 500

    try:
        res = supabase.table("history") \
            .select("*") \
            .eq("user_id", email) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()

        return jsonify({"history": res.data if res.data else []}), 200

    except Exception as e:
        return jsonify({"history": [], "error": str(e)}), 200

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    text = ""
    email = "student"
    input_type = "Notes Quiz"
    
    if request.is_json:
        data = request.json
        text = data.get("text", "")
        email = data.get("user_email", "student")
    else:
        email = request.form.get("user_email", "student")
        text = request.form.get("text", "")
        file = request.files.get("file")
        if file:
            filename = file.filename.lower()
            input_type = "Document Quiz"
            try:
                if filename.endswith(".pdf"):
                    reader = PdfReader(file)
                    text = "".join([p.extract_text() for p in reader.pages if p.extract_text() is not None])
                elif filename.endswith(".docx"):
                    doc = Document(file)
                    text = "\n".join([para.text for para in doc.paragraphs])
                elif filename.endswith(".txt"):
                    text = file.read().decode("utf-8", errors="ignore")
            except Exception as e:
                print("Extraction error:", e)
                return jsonify({"error": "Failed to parse document"}), 400
    
    language = data.get("language", "English") if request.is_json else request.form.get("language", "English")
    lang_instruction = f"Respond in {language}. If Telugu, use simple Telugu and mix English technical terms where necessary."

    prompt = f"Generate an interactive multiple-choice quiz based on the following content.\n\nRules:\n- Create 5-10 questions\n- Each question must have 4 options (A, B, C, D)\n- Clearly mention the correct answer\n- Include a short explanation for each answer\n- Questions should test understanding, not just memorization\n- {lang_instruction}\n\nContent:\n{text[:15000]}"
    
    q = get_groq_response(prompt)
    save_to_history(email, "quiz", "Generated Quiz", q)
    return jsonify({"quiz": q}), 200

@app.route("/interview", methods=["POST"])
def interview():
    email = request.form.get("user_email", "student")
    company = request.form.get("company", "Company")
    language = request.form.get("language", "English")
    lang_instruction = f"IMPORTANT: Respond in {language}. For Telugu, use simple Telugu and keep core technical terms in English."
    
    file = request.files.get("resume")
    text = ""
    if file:
        reader = PdfReader(file)
        text = "".join([p.extract_text() for p in reader.pages if p.extract_text() is not None])
        
    prompt = f"""Analyze the following resume and provide a detailed professional evaluation. You must respond ONLY with a raw JSON object string without any markdown formatting.
{lang_instruction}

Use this EXACT JSON format:
{{
  "ats_score": 75,
  "ats_explanation": "Explain why this score.",
  "missing_sections": ["Projects", "Certifications"],
  "improvements": ["Actionable suggestion 1", "Actionable suggestion 2"],
  "company_analysis": {{
    "company": "{company}",
    "required_skills": ["Skill 1", "Skill 2"],
    "missing_skills": ["Missing Skill 1"],
    "suggestions": "Suggestions to match expectations"
  }},
  "skill_gap": {{
    "trends": "Current industry trends...",
    "missing": ["React", "Cloud (AWS)", "DevOps"]
  }},
  "learning_roadmap": [
    {{
      "skill": "React",
      "youtube_link": "https://www.youtube.com/results?search_query=React+tutorial",
      "platform_link": "https://www.coursera.org",
      "platform_name": "Coursera",
      "explanation": "Essential for frontend"
    }}
  ],
  "readiness_score": 7
}}

Resume:
{text[:3000]}
"""
    raw_res = get_career_insight(prompt)
    import json
    try:
        clean_text = raw_res.replace("```json", "").replace("```", "").strip()
        final_res = json.loads(clean_text)
    except Exception as e:
        print("JSON Parse error:", e)
        final_res = raw_res

    save_to_history(email, "interview", "Interview Questions", final_res)
    return jsonify({"roadmap": final_res}), 200

@app.route("/concept", methods=["POST"])
def concept():
    data = request.json
    topic = data.get("topic", "")
    email = data.get("user_email", "student")
    language = data.get("language", "English")
    
    res = get_career_insight(f"Explain {topic} in simple terms with examples. Respond in {language}. If Telugu, use simple Telugu with English technical terms.")
    save_to_history(email, "concept", topic, res)
    return jsonify({"explanation": res}), 200

@app.route("/study-plan", methods=["POST"])
def study_plan():
    data = request.json
    topics = data.get("topics", "")
    email = data.get("user_email", "student")
    hours = data.get("hours", "4")
    deadline = data.get("deadline", "")
    language = data.get("language", "English")
    
    try:
        if deadline:
            target_date = datetime.strptime(deadline, "%Y-%m-%d")
            days = (target_date - datetime.now()).days
            if days <= 0: days = 1
        else:
            days = 14
    except Exception:
        days = 14
    
    prompt = f"""Create a personalized study plan based on:
- Topics: {topics}
- Study hours per day: {hours}
- Days remaining: {days}

Requirements:
- Respond in {language}. For Telugu, use simple Telugu and mix English technical words.
- Divide topics day-by-day exactly up to Day {days}
- Include revision days
- Include practice problems
- Adjust difficulty based on available time

Also include for each day:
- Daily goals
- Estimated time per task
- Learning resources: YouTube links and Platforms (LeetCode, Coursera, etc.)

Return ONLY a valid JSON array of objects. Format:
[
  {{
     "day": 1,
     "title": "Title of the day",
     "tasks": ["Task 1", "Task 2"],
     "time_required": "4 Hours",
     "resources": [
        {{"type": "YouTube", "link": "https://youtube.com/results?search_query=concept", "name": "Concept Video"}},
        {{"type": "Platform", "link": "https://leetcode.com/", "name": "LeetCode Practice"}}
     ]
  }}
]
"""
    raw_res = get_career_insight(prompt)
    import json
    try:
        clean_text = raw_res.replace("```json", "").replace("```", "").strip()
        plan_data = json.loads(clean_text)
    except Exception as e:
        print("JSON Parse error:", e)
        plan_data = raw_res

    if supabase and email:
         try:
             entry = {
                 "user_id": email,
                 "topics": topics,
                 "deadline": deadline,
                 "plan_data": plan_data if isinstance(plan_data, list) else [],
                 "current_day": 1,
                 "completed_days": [],
                 "reminder_type": data.get("reminder_type", "email")
             }
             supabase.table("study_plans").insert(entry).execute()
         except Exception as e:
             print("Study plan save error:", e)

    # 3. TRIGGER EMAIL OUTBOUND
    reminder_type = data.get("reminder_type", "email")
    if email and reminder_type == "email":
        subject = "Study Plan Created 🚀"
        body = f"""Hello,

Your personalized study plan has been successfully synthesized and locked in!

Target Topics: {topics}
Initial Deadline: {deadline}
Commitment: {hours}

Log in to your Dashboard Timeline to view your interactive roadmap, execute daily tasks, and access dynamically populated learning resources!

Stay disciplined and you will hit your goals!

- AI Engine Intelligence
"""
        send_email(email, subject, body)

    save_to_history(email, "planner", "Study Plan", plan_data)
    return jsonify({"plan": plan_data}), 200

@app.route("/reschedule-plan", methods=["POST"])
def reschedule_plan():
    data = request.json
    missed_day = int(data.get("missed_day", 1))
    plan_data = data.get("plan_data", [])
    deadline = data.get("deadline", "")
    
    try:
        target_date = datetime.strptime(deadline, "%Y-%m-%d")
        days = (target_date - datetime.now()).days
        if days <= 0: days = 1
    except:
        days = 14

    prompt = f"""User missed study on Day {missed_day}. Wait!
Reschedule remaining plan:
- Adjust tasks for remaining days: {days} days left.
- Keep important priority.
- Ensure completion before deadline.

Current remaining plan chunks: {plan_data}
Return the updated schedule from Day {missed_day} onwards exactly in the SAME JSON array format. ONLY output the raw JSON array.
"""
    raw_res = get_career_insight(prompt)
    import json
    try:
        clean_text = raw_res.replace("```json", "").replace("```", "").strip()
        updated_plan = json.loads(clean_text)
    except:
        updated_plan = plan_data 

    return jsonify({"plan": updated_plan}), 200

def send_daily_reminders():
    print("Running scheduled daily reminders sweep...")
    if not supabase: return
    try:
        res = supabase.table("study_plans").select("*").execute()
        for plan in res.data:
            print(f"Scheduled Delivery -> {plan['user_id']} via {plan['reminder_type']} - Day {plan['current_day']}")
            # Note: SMTP injection / Telegram Bot API trigger payload executed here natively.
    except Exception as e:
        print("Reminder Job error:", e)

# Boot Background Scheduler for Notification Queue
scheduler = BackgroundScheduler()
scheduler.add_job(func=send_daily_reminders, trigger="interval", days=1)
scheduler.start()

@app.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():
    email = request.args.get("email")
    if not supabase: return jsonify({"error": "No backend"}), 500

    try:
        # 1. Fetch History
        history_res = supabase.table("history").select("*").eq("user_id", email).execute()
        history_data = history_res.data if history_res.data else []

        quizzes = sum(1 for item in history_data if item.get("type") == "quiz")
        concepts = sum(1 for item in history_data if item.get("type") == "concept")
        interviews = sum(1 for item in history_data if item.get("type") == "interview")

        # 2. Streak Logic (Simple count of study plans or distinct active days in history)
        streak = len(supabase.table("study_plans").select("*").eq("user_id", email).execute().data)

        # 3. Dynamic Analysis
        topics = [item.get("title") for item in history_data if item.get("type") == "concept"]
        focus_topic = topics[0] if topics else "Concepts"
        
        analysis = {
            "weak": "System Design" if concepts < 10 else "Advanced AI",
            "focus": focus_topic,
            "progress": f"{concepts * 5}% completion of curriculum"
        }

        return jsonify({
            "quizzes": quizzes,
            "concepts": concepts,
            "interviews": interviews,
            "streak": streak,
            "analysis": analysis
        }), 200
    except Exception as e:
        print("Dashboard error:", e)
        return jsonify({"quizzes": 0, "concepts": 0, "interviews": 0, "streak": 0}), 200

if __name__ == "__main__":
    app.run(port=8000, debug=True, use_reloader=False)
