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

# ---------------- CORE FUNCTIONS ----------------

def get_gemini_response(prompt, is_telugu=False):
    """Handles resume analysis and translations using first available Gemini model."""
    try:
        # Dynamic model discovery
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        if not available_models:
            return "Gemini Error: No models found with 'generateContent' support."
        
        # Prefer flash for speed, otherwise take first
        selected_model = next((m for m in available_models if 'flash' in m), available_models[0])
        
        model = genai.GenerativeModel(selected_model)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini Error: {str(e)}"

def get_groq_response(prompt):
    """Handles fast chat responses using Groq with decommissioned model protection."""
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    last_err = ""
    for m_id in models_to_try:
        try:
            chat_completion = client_groq.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=m_id,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            last_err = str(e)
            continue
    return f"Groq Error (all models failed): {last_err}"

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
    tabs = st.tabs(["📄 Resume", "🎯 Interview", "🧠 Evaluator", "📝 Quiz", "💡 Explainer", "🕒 History"])

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
                    
                    p = f"Analysing resume for {st.session_state.user['name']} from {st.session_state.user['branch']}. Provide: 1. Score (0-100), 2. Strengths/Weaknesses, 3. 7-Day Personalized Roadmap for {target_role if target_role else 'Campus Placement'}. Resume: {text}"
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

    # 2. INTERVIEW PREP
    with tabs[1]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("🎯 Question Engine")
        role_q = st.text_input("Job Role For Interview Prep")
        if st.button("⚡ Generate Questions (Groq Fast)"):
            with st.spinner("Fetching questions..."):
                q_prompt = f"Generate 5 interview questions for {role_q}. 3 Tech, 2 HR."
                q_res = get_groq_response(q_prompt)
                st.markdown(f"<div class='info-box'>{q_res}</div>", unsafe_allow_html=True)
                if st.session_state.lang == "Telugu":
                    st.info(get_gemini_response(f"Translate to Telugu: {q_res}"))
        st.markdown("</div>", unsafe_allow_html=True)

    # 3. ANSWER EVALUATOR
    with tabs[2]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("🧠 Smart Evaluation")
        ques = st.text_area("The Question")
        ans = st.text_area("Your Response")
        if st.button("🔍 Evaluate My Answer"):
            with st.spinner("Judging..."):
                e_p = f"Evaluate this answer for question: {ques}. Answer: {ans}. Score it and provide perfect version."
                e_res = get_groq_response(e_p)
                st.markdown(f"<div class='info-box'>{e_res}</div>", unsafe_allow_html=True)
                if st.session_state.lang == "Telugu":
                    st.info(get_gemini_response(f"Translate to Telugu: {e_res}"))
        st.markdown("</div>", unsafe_allow_html=True)

    # 4. QUIZ GENERATOR (T2-2)
    with tabs[3]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("📝 Personalized Skill Quiz")
        q_topic = st.text_input("Quiz Topic (Leave blank for Resume-based)", placeholder="e.g. Python, SQL")
        if st.button("🎲 Generate 10 MCQs"):
            with st.spinner("Creating Quiz..."):
                qz_p = f"Create 10 MCQ questions on {q_topic if q_topic else 'general CS topics'} with answers. Format clearly."
                qz_res = get_groq_response(qz_p)
                st.markdown(f"<div class='info-box'>{qz_res}</div>", unsafe_allow_html=True)
                render_download_button(qz_res, "Skill_Quiz.pdf")
        st.markdown("</div>", unsafe_allow_html=True)

    # 5. CONCEPT EXPLAINER (T2-3)
    with tabs[4]:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.header("💡 AI Concept Explainer")
        topic_ex = st.text_input("What do you want to learn today?")
        if st.button("📖 Explain Clearly"):
            with st.spinner("Simplifying..."):
                ex_p = f"Explain {topic_ex} with: 1. Simple Definition, 2. Analogy, 3. Code Example."
                ex_res = get_groq_response(ex_p)
                st.markdown(f"<div class='info-box'>{ex_res}</div>", unsafe_allow_html=True)
                st.markdown("### 🇮🇳 Telugu Translation")
                st.markdown(f"<div class='info-box'>{get_gemini_response(f'Explain {topic_ex} simply in Telugu')}</div>", unsafe_allow_html=True)
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