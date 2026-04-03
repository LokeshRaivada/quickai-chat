import streamlit as st
from groq import Groq
from PyPDF2 import PdfReader
import resend
import urllib.parse
import google.generativeai as genai
import json
import os
from datetime import datetime
from fpdf import FPDF
import base64

# ---------------- CONFIG & API SETUP ----------------
st.set_page_config(
    page_title="HireGen AI | GMRIT Placement Assistant", 
    layout="wide", 
    page_icon="🚀",
    initial_sidebar_state="expanded"
)

# Load Secrets from Streamlit Secrets
try:
    GROQ_API_KEY = st.secrets["GROQ_API_KEY"]
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
    # Fallback for Resend API Key if not in secrets
    RESEND_API_KEY = st.secrets.get("RESEND_API_KEY", "re_BCMq42pY_ETfi6hyzdocQqsjKksaKY8zU")
except Exception as e:
    st.error("Missing API Keys in st.secrets! Please add GROQ_API_KEY and GEMINI_API_KEY.")
    st.stop()

# Initialize AI Clients
client_groq = Groq(api_key=GROQ_API_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# Use a more stable model name or fallback
try:
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
except:
    gemini_model = genai.GenerativeModel('gemini-pro')

# ---------------- PERSISTENCE LOGIC ----------------
HISTORY_FILE = "history.json"

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_to_history(user_data, feature, input_text, result):
    history = load_history()
    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user": user_data,
        "feature": feature,
        "input": input_text[:150] + "..." if len(input_text) > 150 else input_text,
        "result": result
    }
    history.insert(0, entry)
    # Keep last 10 entries as requested
    with open(HISTORY_FILE, "w") as f:
        json.dump(history[:10], f, indent=4)

# ---------------- UI & STYLING ----------------
def apply_custom_styles():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        
        * { font-family: 'Outfit', sans-serif; }

        .stApp {
            background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%);
            color: #f8fafc;
        }
        
        /* Glassmorphism Cards */
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border-radius: 24px;
            padding: 35px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 25px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
        }
        
        .glass-card:hover { border: 1px solid rgba(99, 102, 241, 0.4); transform: translateY(-5px); }

        /* Sidebar Styling */
        section[data-testid="stSidebar"] {
            background: rgba(15, 23, 42, 0.9) !important;
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255,255,255,0.05);
        }

        /* Custom Tabs */
        .stTabs [data-baseweb="tab-list"] {
            gap: 15px;
            background-color: transparent;
        }
        .stTabs [data-baseweb="tab"] {
            height: 60px;
            background-color: rgba(255,255,255,0.02);
            border-radius: 12px;
            color: #94a3b8;
            padding: 10px 25px;
            border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.3s ease;
        }
        .stTabs [aria-selected="true"] {
            background-color: rgba(99, 102, 241, 0.2) !important;
            color: #818cf8 !important;
            border: 1px solid #818cf8 !important;
        }

        /* Modern Typography */
        h1, h2, h3 { color: #f8fafc; font-weight: 700; }
        .gradient-text {
            background: linear-gradient(90deg, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Buttons & Inputs */
        .stButton>button {
            width: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed) !important;
            color: white !important;
            border: none !important;
            border-radius: 14px !important;
            padding: 16px !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
            transition: all 0.3s ease !important;
        }
        .stButton>button:hover { transform: scale(1.02); box-shadow: 0 8px 25px rgba(79, 70, 229, 0.5) !important; }

        .wa-button {
            background: #10b981 !important;
            text-decoration: none;
            color: white !important;
            padding: 14px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-top: 10px;
        }

        .info-box {
            background: rgba(99, 102, 241, 0.05);
            border-left: 5px solid #6366f1;
            padding: 20px;
            border-radius: 12px;
            margin: 15px 0;
            line-height: 1.6;
            color: #cbd5e1;
        }
        
        /* Footer */
        footer {
            text-align: center;
            padding: 40px;
            color: #64748b;
            border-top: 1px solid rgba(255,255,255,0.05);
            margin-top: 60px;
        }
        </style>
    """, unsafe_allow_html=True)

# ---------------- CORE AI PERSONA ----------------
SYSTEM_PROMPT = """You are an AI Placement Assistant designed to help GMRIT students.
Your capabilities include: Resume analysis, Quiz generation/evaluation, Interview simulation, Concept explanation, and Roadmap creation.
Style: Be concise, practical, and focus on improving user performance. 
Adapt responses to user level (Beginner/Intermediate/Advanced).

Formatting Rules:
- Use emojis in headings (e.g. ### ⭐, ### ✅, ### 🔧)
- Use ONLY bullet points for content.
- Keep clear spacing between sections.
- NO long paragraphs; only short, actionable points.
- Optimize for a clean, card-based interface.
"""

def get_gemini_response(prompt, is_telugu=False):
    """Handles resume analysis and translations using first available Gemini model."""
    full_p = f"{SYSTEM_PROMPT}\n\nTask: {prompt}"
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        if not available_models:
            return "Gemini Error: No models found."
        selected_model = next((m for m in available_models if 'flash' in m), available_models[0])
        model = genai.GenerativeModel(selected_model)
        response = model.generate_content(full_p)
        return response.text
    except Exception as e:
        return f"Gemini Error: {str(e)}"

def get_groq_response(prompt):
    """Handles fast chat responses using Groq with global persona system instruction."""
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    last_err = ""
    for m_id in models_to_try:
        try:
            chat_completion = client_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                model=m_id,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            last_err = str(e)
            continue
    return f"Groq Error: {last_err}"

def generate_pdf(content, title="HireGen AI Report"):
    """Creates a downloadable PDF of the generated content."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt=title, ln=True, align='C')
    pdf.set_font("Arial", size=11)
    pdf.ln(10)
    # Sanitize for PDF encoding
    clean_content = content.encode('latin-1', 'ignore').decode('latin-1')
    pdf.multi_cell(0, 8, txt=clean_content)
    
    pdf_output = pdf.output(dest='S').encode('latin-1')
    b64_pdf = base64.b64encode(pdf_output).decode('utf-8')
    return b64_pdf

def render_download_button(content, filename="HireGen_Report.pdf"):
    b64_pdf = generate_pdf(content)
    href = f'<a href="data:application/pdf;base64,{b64_pdf}" download="{filename}" style="text-decoration:none;"><button style="width:100%; background:#1e293b; color:white; border:1px solid #334155; padding:12px; border-radius:12px; cursor:pointer; font-weight:600;">📥 Download PDF Analysis</button></a>'
    st.markdown(href, unsafe_allow_html=True)

# ---------------- APP MAIN ----------------

def main():
    apply_custom_styles()
    
    # Session States
    if 'history' not in st.session_state: st.session_state.history = load_history()
    if 'lang' not in st.session_state: st.session_state.lang = "English"
    if 'user' not in st.session_state: st.session_state.user = {"name": "", "branch": "CSE", "college": "GMRIT"}

    # --- SIDEBAR & LOGIN ---
    with st.sidebar:
        st.markdown("<h1 class='gradient-text' style='font-size: 2.2rem;'>HireGen AI</h1>", unsafe_allow_html=True)
        st.image("https://img.icons8.com/fluency/144/rocket.png", width=100)
        
        st.markdown("### 🎓 Student Identity")
        st.session_state.user["name"] = st.text_input("Name", value=st.session_state.user["name"])
        st.session_state.user["branch"] = st.selectbox("Branch", ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "CS-BS", "CS-AIML"], index=0)
        st.session_state.user["college"] = st.text_input("College", value="GMRIT", disabled=True)
        
        st.divider()
        st.markdown("### 🌍 Global Language Toggle")
        st.session_state.lang = st.radio("Setting", ["English", "Telugu"], horizontal=True)
        
        st.divider()
        if st.session_state.user["name"]:
            st.success(f"Loginned: {st.session_state.user['name']}")
        
        st.info("💡 Tip: Use Gemini Vision for best Resume insights!")

    # --- TOP HERO SECTION ---
    st.markdown(f"""
        <div style='text-align: center;'>
            <h1 style='font-size: 3.8rem; letter-spacing: -1px;'>Winning <span class='gradient-text'>Placement App</span></h1>
            <p style='color: #64748b; font-size: 1.25rem; font-weight: 400;'>Empowering GMRIT Students with Generative AI for 2026 Hackathon</p>
        </div>
    """, unsafe_allow_html=True)

    # --- NAVIGATION TABS ---
    tabs = st.tabs(["📄 Resume Intelligence", "🎯 Mock Interview", "🧠 Answer Evaluator", "📝 Skill Quiz", "💡 AI Mentor", "🕒 History Log"])

    # 1. RESUME ANALYZER + ROADMAP
    with tabs[0]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("📄 AI Resume Intelligence")
        
        c1, c2 = st.columns([2, 1])
        with c1:
            resume_file = st.file_uploader("Upload PDF Resume", type=["pdf"])
        with c2:
            target_role = st.text_input("Target Role", placeholder="e.g. Java Designer")
            email_to = st.text_input("Email Report")

        if st.button("🚀 Analyze & Create 7-Day Roadmap"):
            if not resume_file: st.warning("Upload Resume first!")
            else:
                with st.spinner("Gemini is decoding your career..."):
                    reader = PdfReader(resume_file)
                    text = "".join([p.extract_text() for p in reader.pages])
                    
                    p = f"""You are an expert resume reviewer. Analyze this resume for {st.session_state.user['name']}.
                    
                    Rules:
                    - Use ONLY simple English. No complex words.
                    - Give ONLY 5-7 key points (strictly 1 line each).
                    - Give exactly 3 practical improvements (strictly 1 line each).
                    - Format strictly as requested.

                    ### ⭐ Resume Score:
                    [Score]/100

                    ### ✅ Key Points:
                    - [Point 1]
                    - [Point 2]
                    - [Point 3]
                    - [Point 4]
                    - [Point 5]

                    ### 🔧 Improvements:
                    - [Imp 1]
                    - [Imp 2]
                    - [Imp 3]

                    ### 🚀 Personalized Questions:
                    - [Intelligent Hybrid Q1]
                    - [Intelligent Hybrid Q2]
                    - [Intelligent Hybrid Q3]

                    ### 🔥 Final 7 Days Prep Plan (Role: {target_role if target_role else 'Campus Placement'})
                    Rules for Plan:
                    - Focus ONLY on revision (not learning new topics).
                    - For Day 1 to 6, use the format:
                        - Revise: (2 simple points)
                        - Practice: (1-2 simple tasks)
                    - For Day 7: Mock Interview + Quick Revision.
                    - Keep it short, clean, and professional.

                    Resume Content: {text}
                    """
                    result = get_gemini_response(p)
                    
                    st.markdown("### 📊 Strategic Feedback")
                    st.markdown(f"<div class='info-box'>{result}</div>", unsafe_allow_html=True)
                    
                    if st.session_state.lang == "Telugu":
                        with st.spinner("ట్రాన్స్‌లేట్ చేస్తున్నాము..."):
                            tel_res = get_gemini_response(f"Translate this career report to professional Telugu: {result}")
                            st.markdown("### 🇮🇳 తెలుగు రిపోర్ట్")
                            st.markdown(f"<div class='info-box' style='border-left-color: #10b981;'>{tel_res}</div>", unsafe_allow_html=True)
                    
                    render_download_button(result, "HireGen_Roadmap.pdf")
                    save_to_history(st.session_state.user, "Resume Analysis", text[:200], result)
        st.markdown("</div>", unsafe_allow_html=True)

    # 2. INTERVIEW PREP (LIVE AI INTERVIEWER)
    with tabs[1]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("🎯 Live AI Interviewer")
        
        if 'interview_active' not in st.session_state:
            st.session_state.interview_active = False
            st.session_state.interview_q_count = 0
            st.session_state.interview_log = []

        if not st.session_state.interview_active:
            prep_mode = st.radio("Prep Mode", ["Corporate Placement", "Competitive Exam", "Topic-Specific"], horizontal=True)
            
            if prep_mode == "Corporate Placement":
                role_iv = st.text_input("Job Role", placeholder="e.g. Data Scientist")
                skills_iv = st.text_input("Your Key Skills", placeholder="e.g. Python, SQL")
                projects_iv = st.text_area("Your Key Projects", placeholder="e.g. AI Chatbot")
            elif prep_mode == "Competitive Exam":
                role_iv = st.selectbox("Exam Domain", ["Civil Services (UPSC)", "Banking (IBPS/RRB)", "SSC CGL", "Group-1 (State)", "Other competitive exams"])
                skills_iv = "Conceptual Depth, Ethics, General Awareness" 
                projects_iv = "Context: Scenario-based and Current Affairs" 
            else:
                role_iv = st.text_input("Target Topic for Practice", placeholder="e.g. SQL Joins, React Hooks, UPSC Ethics")
                skills_iv = f"Mastery of {role_iv}"
                projects_iv = f"Deep-dive in {role_iv}"

            c1, c2 = st.columns(2)
            n_tech = c1.number_input("Number of Focused Questions", 1, 10, 3)
            n_hr = c2.number_input("Number of Practical Questions", 1, 5, 2)
            
            if st.button("🏁 Launch Specialized Prep"):
                st.session_state.interview_active = True
                st.session_state.interview_role = role_iv
                st.session_state.prep_mode = prep_mode
                st.session_state.interview_q_count = 1
                st.session_state.total_iv_qs = n_tech + n_hr
                with st.spinner(f"AI {role_iv} Expert is initializing..."):
                    if prep_mode == "Corporate Placement":
                        first_q_prompt = f"Expert recruiter for {role_iv}. Ask 1st tech question only based on skills/projects."
                    elif prep_mode == "Competitive Exam":
                        first_q_prompt = f"Expert examiner for {role_iv}. Ask 1st conceptual or scenario question. Use heading: ### 📚 {role_iv} Question."
                    else:
                        first_q_prompt = f"Expert tutor for {role_iv}. Ask 1st practical question only on {role_iv}. Use heading: ### 🎯 Topic-Based Question."
                    
                    first_q = get_groq_response(first_q_prompt)
                    st.session_state.interview_log.append({"role": "interviewer", "content": first_q})
                    st.rerun()
        else:
            # Display Transcript
            # (Keeping transcript display as-is for brevity, updated n_qs logic below)
            for msg in st.session_state.interview_log:
                if msg["role"] == "interviewer":
                    st.markdown(f"**🤖 Interviewer:**\n{msg['content']}")
                else:
                    st.markdown(f"**👤 You:**\n{msg['content']}")
            
            if st.session_state.interview_q_count <= st.session_state.total_iv_qs:
                # Answer Input
                user_ans = st.text_area("Your Answer", placeholder="Type your answer here...", height=100)
                if st.button("📤 Submit Answer"):
                    if user_ans:
                        st.session_state.interview_log.append({"role": "user", "content": user_ans})
                        with st.spinner("Reviewing..."):
                            feedback_prompt = f"""
                            Candidate Answer: {user_ans}
                            Tasks:
                            - Evaluate based on correctness, clarity and confidence.
                            - Give score out of 10.
                            - Suggest 1 improvement.
                            - Then ask the NEXT question (Question {st.session_state.interview_q_count + 1} of {st.session_state.total_iv_qs}).
                            - Rule: Mix domain knowledge of {st.session_state.interview_role} with technology usage.
                            - Use heading: ### ⚙️ Mixed Question.
                            - If total questions reached, conclude graciously.
                            """
                            next_step = get_groq_response(feedback_prompt)
                            st.session_state.interview_log.append({"role": "interviewer", "content": next_step})
                            st.session_state.interview_q_count += 1
                            st.rerun()
            else:
                st.success("🎉 Interview Completed! Check summary above.")
                if st.button("🔄 Restart & Try New Role"):
                    del st.session_state.interview_active
                    st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    # 3. ANSWER EVALUATOR
    with tabs[2]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("🧠 Expert Response Evaluator")
        ques = st.text_area("Copy Interview Question here")
        ans = st.text_area("Your Draft Response", height=150)
        if st.button("🔍 Run Full Assessment"):
            if ques and ans:
                with st.spinner("Analyzing correctness, clarity, and completeness..."):
                    eval_p = f"""You are an expert technical evaluator.
                    Question: {ques}
                    User Answer: {ans}
                    
                    Evaluate based on:
                    - Correctness
                    - Completeness
                    - Clarity
                    
                    Provide:
                    1. Score out of 10
                    2. What is correct in the response
                    3. What is missing or needs fix
                    4. Improved answer (the Professional/Ideal version)
                    
                    Keep it constructive and pedagogical.
                    """
                    e_res = get_groq_response(eval_p)
                    st.markdown(f"<div class='info-box'>{e_res}</div>", unsafe_allow_html=True)
                    if st.session_state.lang == "Telugu":
                        st.info(get_gemini_response(f"Translate this evaluation to Telugu: {e_res}"))
            else:
                st.warning("Please provide both question and answer.")
        st.markdown("</div>", unsafe_allow_html=True)

    # 4. SKILL QUIZ (LIVE INTERACTIVE QUIZ)
    with tabs[3]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("📝 Live Interactive Quiz Hub")
        
    # 4. SKILL QUIZ (ULTIMATE LIVE HUB)
    with tabs[3]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("📝 Ultimate AI Quiz Hub")
        
        if 'quiz_active_live' not in st.session_state:
            st.session_state.quiz_active_live = False
            st.session_state.quiz_q_count = 0
            st.session_state.quiz_correct = 0
            st.session_state.quiz_wrong = 0
            st.session_state.quiz_skipped = 0
            st.session_state.quiz_results_log = []
            st.session_state.quiz_pdf_text = ""

        if not st.session_state.quiz_active_live:
            qz_mode = st.radio("Quiz Mode", ["Topic-based", "PDF/Document-based"], horizontal=True)
            qz_topic = st.text_input("Target Topic (e.g. Python, SQL)", placeholder="React, Java...") if qz_mode == "Topic-based" else ""
            qz_pdf = st.file_uploader("Upload PDF", type=["pdf"]) if qz_mode == "PDF/Document-based" else None
            qz_n = st.number_input("Number of Questions", 1, 50, 5)
            
            if st.button("🏁 Start Professional Quiz"):
                if qz_mode == "PDF/Document-based" and qz_pdf:
                    with st.spinner("Extracting..."):
                        st.session_state.quiz_pdf_text = "".join([p.extract_text() for p in PdfReader(qz_pdf).pages])[:8000]
                
                st.session_state.quiz_active_live = True
                st.session_state.quiz_topic = qz_topic if qz_mode == "Topic-based" else (qz_pdf.name if qz_pdf else "Doc")
                st.session_state.quiz_total_qs = qz_n
                st.session_state.quiz_q_count = 1
                st.session_state.quiz_correct = 0
                st.session_state.quiz_wrong = 0
                st.session_state.quiz_skipped = 0
                st.session_state.quiz_results_log = []

                with st.spinner("Drafting Q1..."):
                    p_start = f"Quiz Examiner for {st.session_state.quiz_topic}. Ask MCQ 1. A,B,C,D. No answer. (PDF: {st.session_state.quiz_pdf_text[:1000]})"
                    st.session_state.current_quiz_text = get_groq_response(p_start)
                    st.rerun()
        
        elif st.session_state.quiz_active_live == "FINISHED":
            st.balloons()
            rep_p = f"""Quiz Evaluator. Correct: {st.session_state.quiz_correct}, Wrong: {st.session_state.quiz_wrong}, Skipped: {st.session_state.quiz_skipped}.
            Format:
            ### 🏆 Result:
            Score: {st.session_state.quiz_correct} / {st.session_state.quiz_total_qs}
            ### 📊 Breakdown:
            - Correct: {st.session_state.quiz_correct}
            - Wrong: {st.session_state.quiz_wrong}
            - Skipped: {st.session_state.quiz_skipped}
            ### 📌 Performance:
            [Beginner/Intermediate/Advanced]
            ### 🚀 Improvement Tips:
            - [Tip 1]
            - [Tip 2]
            """
            report = get_groq_response(rep_p)
            st.markdown(f"<div class='info-box'>{report}</div>", unsafe_allow_html=True)
            
            with st.expander("📖 View Full Answer Key"):
                for res in st.session_state.quiz_results_log:
                    st.markdown(f"**Question:**\n{res['question']}")
                    st.markdown(f"**Evaluation:**\n{res['feedback']}")
                    st.divider()

            if st.button("🔄 Restart Lab"):
                st.session_state.quiz_active_live = False
                st.rerun()
        
        else:
            st.markdown(f"#### 📝 Question {st.session_state.quiz_q_count} / {st.session_state.quiz_total_qs}")
            st.markdown(f"<div class='info-box'>{st.session_state.current_quiz_text}</div>", unsafe_allow_html=True)
            user_opt = st.radio("Pick Answer", ["A", "B", "C", "D"], key=f"q_radio_{st.session_state.quiz_q_count}")
            
            c1, c2 = st.columns(2)
            with c1:
                if st.button("✅ Submit"):
                    p_check = f"Question: {st.session_state.current_quiz_text}\nUser: {user_opt}. Start with [CORRECT] or [WRONG]. Then show answer. Then if not last, ask MCQ {st.session_state.quiz_q_count+1}."
                    res = get_groq_response(p_check)
                    if "[CORRECT]" in res.upper(): st.session_state.quiz_correct += 1
                    else: st.session_state.quiz_wrong += 1
                    
                    st.session_state.quiz_results_log.append({"question": st.session_state.current_quiz_text, "feedback": res})
                    if st.session_state.quiz_q_count < st.session_state.quiz_total_qs:
                        st.session_state.quiz_q_count += 1
                        st.session_state.current_quiz_text = res
                        st.rerun()
                    else:
                        st.session_state.quiz_active_live = "FINISHED"
                        st.rerun()
            with c2:
                if st.button("⏭️ Pass"):
                    st.session_state.quiz_skipped += 1
                    p_pass = f"User Skipped {st.session_state.current_quiz_text}. Show answer briefly. Then if not last, ask MCQ {st.session_state.quiz_q_count+1}."
                    res_p = get_groq_response(p_pass)
                    st.session_state.quiz_results_log.append({"question": st.session_state.current_quiz_text, "feedback": "Skipped. " + res_p})
                    if st.session_state.quiz_q_count < st.session_state.quiz_total_qs:
                        st.session_state.quiz_q_count += 1
                        st.session_state.current_quiz_text = res_p
                        st.rerun()
                    else:
                        st.session_state.quiz_active_live = "FINISHED"
                        st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    # 5. CONCEPT EXPLAINER (T2-3)
    with tabs[4]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("💡 AI Multi-Domain Mentor")
        
        c1, c2 = st.columns([2, 1])
        with c1:
            topic_ex = st.text_input("Ask about any concept...", placeholder="e.g. Recursion, Fiscal Deficit, Blockchain in Voting")
        with c2:
            ex_domain = st.selectbox("Your Aim", ["Software Jobs", "Civil Services (UPSC)", "Banking Exams", "Other Government Exams"])
            
        if st.button("📖 Explain Clearly"):
            if topic_ex:
                    if ex_domain == "Software Jobs":
                        ex_p = f"""You are an expert coding mentor.
                        Question: {topic_ex}
                        
                        Tasks:
                        - Explain concept simply.
                        - Provide a short, clean code example.
                        - Explain the code logic in 2-3 lines.
                        
                        Format:
                        ### 🧾 Answer:
                        - [Simple explanation]

                        ### 💡 Key Points:
                        - [Point 1]
                        - [Point 2]
                        - [Point 3]

                        ### 📌 Example (Code):
                        ```python
                        # Clean Example
                        ```

                        ### 🚀 Tip:
                        - [Technical/Placement tip]
                        """
                    else:
                        ex_p = f"""You are an intelligent AI mentor specialized in {ex_domain}.
                        Question: {topic_ex}
                        
                        Tasks:
                        - Provide a clear answer in simple English.
                        - Explain in context of {ex_domain}.
                        
                        Format:
                        ### 🧾 Answer:
                        - [Simple explanation]

                        ### 💡 Key Points:
                        - [Focus Point 1]
                        - [Focus Point 2]
                        - [Focus Point 3]

                        ### 📌 Example:
                        - [Practical domain example]

                        ### 🚀 Tip:
                        - [Preparation tip for {ex_domain}]
                        """
                    ex_res = get_groq_response(ex_p)
                    st.markdown(f"<div class='info-box'>{ex_res}</div>", unsafe_allow_html=True)
                    if st.session_state.lang == "Telugu":
                        st.markdown("### 🇮🇳 తెలుగు వివరణ")
                        st.info(get_gemini_response(f"Translate this {ex_domain} mentor explanation to professional Telugu: {ex_res}"))
            else:
                st.warning("Please enter a topic to explain!")
        st.markdown("</div>", unsafe_allow_html=True)

    # 6. HISTORY
    with tabs[5]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("🕒 Recent History")
        h_data = load_history()
        if not h_data: st.info("No records yet.")
        else:
            for item in h_data:
                with st.expander(f"{item['timestamp']} - {item['feature']}"):
                    st.markdown(f"**Brief Details:** {item['input']}")
                    st.markdown(f"**Result:**\n{item['result']}")
        st.markdown("</div>", unsafe_allow_html=True)

    # FOOTER
    st.markdown("""
        <footer>
            <p>Built for <b>GMRIT GenAI Hackathon 2026</b> | Version 2.0 Premium</p>
            <p>Advanced Placement Assistant (#T2-1) + Educational AI Solutions</p>
        </footer>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()