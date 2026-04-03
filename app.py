import streamlit as st
from groq import Groq
from PyPDF2 import PdfReader
import urllib.parse
import google.generativeai as genai
import json
import os
from datetime import datetime
from fpdf import FPDF
import base64
from supabase import create_client, Client

# ---------------- CONFIG & API SETUP ----------------
st.set_page_config(
    page_title="Smart AI | Premium Student Assistant", 
    layout="wide", 
    page_icon="🎓",
    initial_sidebar_state="expanded"
)

# Load Secrets
try:
    GROQ_API_KEY = st.secrets["GROQ_API_KEY"]
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
    SUPABASE_URL = st.secrets.get("SUPABASE_URL", "")
    SUPABASE_KEY = st.secrets.get("SUPABASE_KEY", "")
except Exception as e:
    st.error("Missing API Keys in secrets.toml!")
    st.stop()

# Initialize API Clients
client_groq = Groq(api_key=GROQ_API_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Supabase
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except:
    supabase = None

# ---------------- DATABASE & AUTH LOGIC ----------------
def register_user(name, email, password, branch="CSE"):
    if not supabase: return False, "Backend unreachable"
    try:
        exists = supabase.table("users").select("email").eq("email", email).execute()
        if exists.data: return False, "Email already exists"
        user_data = {"name": name, "email": email, "password": password, "branch": branch}
        supabase.table("users").insert(user_data).execute()
        return True, "Profile Created"
    except Exception as e: return False, str(e)

def login_user(email, password):
    if not supabase: return None
    try:
        res = supabase.table("users").select("*").eq("email", email).eq("password", password).execute()
        return res.data[0] if res.data else None
    except: return None

def load_history(email):
    if not supabase: return []
    try:
        res = supabase.table("history").select("*").eq("user_email", email).order("timestamp", desc=True).limit(10).execute()
        return res.data
    except: return []

def save_to_history(email, name, feature, input_text, result):
    if not supabase: return
    try:
        entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "user_email": email,
            "user_name": name,
            "feature": feature,
            "input": input_text[:150],
            "result": result
        }
        supabase.table("history").insert(entry).execute()
    except: pass

# ---------------- AI HELPERS ----------------
def get_groq_response(prompt):
    try:
        completion = client_groq.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        return completion.choices[0].message.content
    except Exception as e: return f"AI Engine Offline: {str(e)}"

def get_career_insight(prompt):
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text: return response.text
    except:
        try:
            model = genai.GenerativeModel("gemini-pro")
            response = model.generate_content(prompt)
            if response and response.text: return response.text
        except:
            return get_groq_response(f"Expert Academic Advisor: {prompt}")

# ---------------- UI & MODERN STYLING ----------------
def apply_custom_styles():
    st.markdown("""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        /* Global Base */
        html, body, [data-testid="stAppViewContainer"] {
            font-family: 'Inter', sans-serif;
            background-color: #0f172a !important; /* Dark Blue Slate */
            color: #f8fafc !important;
        }

        /* Sidebar Styling */
        [data-testid="stSidebar"] {
            background-color: #020617 !important;
            border-right: 1px solid #1e293b !important;
        }
        [data-testid="stSidebarNav"] { display: none; } /* Hide default nav */
        
        .sidebar-title {
            color: #f8fafc;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Modern Card System */
        .card {
            background: #1e293b;
            padding: 1.5rem;
            border-radius: 16px;
            border: 1px solid #334155;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
            border-color: #3b82f6;
        }
        
        .stat-card {
            text-align: center;
            border-bottom: 4px solid #3b82f6;
        }
        .stat-val { font-size: 2rem; font-weight: 800; color: #3b82f6; }
        .stat-label { font-size: 0.875rem; color: #94a3b8; }

        .quick-action-card {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 1.25rem;
        }

        /* High Visibility Inputs */
        input, textarea, select {
            background-color: #1e293b !important;
            color: #f8fafc !important;
            border: 1px solid #334155 !important;
            border-radius: 12px !important;
        }
        
        /* Primary Buttons */
        .stButton>button {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 12px !important;
            padding: 0.6rem 2rem !important;
            font-weight: 600 !important;
            width: 100% !important;
            transition: all 0.3s ease !important;
        }
        .stButton>button:hover {
            opacity: 0.9 !important;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
        }

        /* Tabs Styling */
        [data-testid="stHorizontalBlock"] { gap: 0 !important; }
        
        .pro-tip {
            background: rgba(59, 130, 246, 0.1);
            border-left: 4px solid #3b82f6;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
        }

        .user-profile {
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 200px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #1e293b;
            border-radius: 12px;
            border: 1px solid #334155;
        }
    </style>
    """, unsafe_allow_html=True)

# ---------------- NAVIGATION ----------------
def sidebar_nav():
    with st.sidebar:
        st.markdown("<div class='sidebar-title'>🎓 Smart AI</div>", unsafe_allow_html=True)
        
        active_tab = st.session_state.get('active_page', 'Dashboard')
        
        pages = {
            "🏠 Dashboard": "Dashboard",
            "🎯 Interview Prep": "Interview Prep",
            "📝 Quiz Generator": "Quiz Generator",
            "💡 Concept Explainer": "Concept Explainer",
            "📅 Study Planner": "Study Planner",
            "🕒 History": "History"
        }
        
        for label, val in pages.items():
            # Styling for active button
            btn_style = "primary" if active_tab == val else "secondary"
            if st.button(label, key=f"nav_{val}", use_container_width=True):
                st.session_state.active_page = val
                st.rerun()
        
        st.markdown("<div style='margin-top: 10rem;'></div>", unsafe_allow_html=True) # Spacer
        
        # User profile
        st.markdown(f"""
        <div class="user-profile">
            <div style="background: #3b82f6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">{st.session_state.user_name[0] if st.session_state.user_name else "S"}</div>
            <div>
                <div style="font-size: 0.8rem; font-weight: 600;">{st.session_state.user_name}</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">{st.session_state.email}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.logged_in = False
            st.rerun()

# ---------------- PAGES ----------------
def render_dashboard():
    st.markdown(f"<h1>Welcome back, {st.session_state.user_name} 👋</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #94a3b8;'>Your AI-powered study companion for academics & placements</p>", unsafe_allow_html=True)
    
    # Stat Cards
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown("<div class='card stat-card'><div class='stat-val'>0</div><div class='stat-label'>Quizzes Taken</div></div>", unsafe_allow_html=True)
    with c2:
        st.markdown("<div class='card stat-card'><div class='stat-val'>0</div><div class='stat-label'>Concepts Learned</div></div>", unsafe_allow_html=True)
    with c3:
        st.markdown("<div class='card stat-card'><div class='stat-val'>0</div><div class='stat-label'>Interview Sessions</div></div>", unsafe_allow_html=True)
    with c4:
        st.markdown("<div class='card stat-card'><div class='stat-val'>0 days</div><div class='stat-label'>Study Streak</div></div>", unsafe_allow_html=True)
    
    st.markdown("<h3 style='margin-top: 2rem;'>Quick Actions</h3>", unsafe_allow_html=True)
    
    # Quick Action Cards
    qa1, qa2 = st.columns(2)
    with qa1:
        if st.button("🎯 Interview Prep\nAI-powered company-specific preparation", key="qa_iv"):
            st.session_state.active_page = "Interview Prep"
            st.rerun()
        if st.button("💡 Concept Explainer\nUnderstand concepts in English & Telugu", key="qa_ex"):
            st.session_state.active_page = "Concept Explainer"
            st.rerun()
    with qa2:
        if st.button("📝 Quiz Generator\nGenerate quizzes from your notes or PDFs", key="qa_qz"):
            st.session_state.active_page = "Quiz Generator"
            st.rerun()
        if st.button("📅 Study Planner\nAI-powered daily study plan with smart scheduling", key="qa_sp"):
            st.session_state.active_page = "Study Planner"
            st.rerun()
            
    st.markdown("""
    <div class="pro-tip">
        <strong>💡 Pro Tip</strong><br>
        Upload your resume in <b>Interview Prep</b> to get personalized company-specific questions. 
        Then use the <b>Quiz Generator</b> with your notes to identify weak areas!
    </div>
    """, unsafe_allow_html=True)

def render_interview_prep():
    st.markdown("<h1>🎯 Interview Prep</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #94a3b8;'>Upload your resume and get tailored interview questions.</p>", unsafe_allow_html=True)
    
    with st.container():
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        pdf_file = st.file_uploader("Upload PDF Resume", type=["pdf"])
        company = st.text_input("Company Name / Role", placeholder="e.g. Google - Software Engineer")
        
        if st.button("🚀 Analyze & Generate Roadmap"):
            if pdf_file:
                with st.spinner("Smart AI is decoding your resume..."):
                    reader = PdfReader(pdf_file)
                    text = "".join([p.extract_text() for p in reader.pages if p.extract_text()])
                    res = get_career_insight(f"Placement analysis for {company}: {text[:3000]}")
                    st.markdown(f"<div class='info-box'>{res}</div>", unsafe_allow_html=True)
                    save_to_history(st.session_state.email, st.session_state.user_name, "Interview Prep", company, res)
            else: st.warning("Please upload a PDF resume.")
        st.markdown("</div>", unsafe_allow_html=True)

def render_quiz_generator():
    st.markdown("<h1>📝 Quiz Generator</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #94a3b8;'>Paste your notes or upload a file to generate a customized quiz.</p>", unsafe_allow_html=True)
    
    with st.container():
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        notes = st.text_area("Your Notes", height=250, placeholder="Paste your study notes here... (e.g., Data Structures, DBMS, OS concepts)")
        uploaded_file = st.file_uploader("Upload TXT file", type=["txt"])
        
        if st.button("🏁 Generate Smart Quiz"):
            source = notes if notes else "Cloud File"
            with st.spinner("Generating competitive questions..."):
                q = get_groq_response(f"Generate 5 MCQs with answers from these notes: {source[:2000]}")
                st.markdown(f"<div class='info-box'>{q}</div>", unsafe_allow_html=True)
                save_to_history(st.session_state.email, st.session_state.user_name, "Quiz Generator", "Notes Quiz", q)
        st.markdown("</div>", unsafe_allow_html=True)

def render_concept_explainer():
    st.markdown("<h1>💡 Concept Explainer</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #94a3b8;'>Understand any complex topic in simple language and multiple languages.</p>", unsafe_allow_html=True)
    
    c1, c2 = st.columns([4, 1])
    with c1:
        topic = st.text_input("topic_search", label_visibility="collapsed", placeholder="e.g., Binary Search Tree, TCP/IP, Polymorphism...")
    with c2:
        if st.button("🔍 Explain"):
            if topic:
                with st.spinner("Explaining..."):
                    res = get_career_insight(f"Explain {topic} in simple terms with examples.")
                    st.session_state.explainer_res = res
            else: st.warning("Enter a topic!")

    if 'explainer_res' in st.session_state:
        st.markdown(f"<div class='card info-box'>{st.session_state.explainer_res}</div>", unsafe_allow_html=True)
        save_to_history(st.session_state.email, st.session_state.user_name, "Concept Explainer", topic, st.session_state.explainer_res)

def render_study_planner():
    st.markdown("<h1>📅 AI Study Planner</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #94a3b8;'>Smart daily plans scheduled around your goals.</p>", unsafe_allow_html=True)
    
    with st.container():
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        topics = st.text_area("Syllabus / Topics", placeholder="Enter subjects and topics, e.g.\nData Structures - Arrays, Linked Lists\nDBMS - Normalization, SQL")
        
        col1, col2 = st.columns(2)
        with col1:
            hours = st.number_input("Study Hours/Day", 1, 16, 4)
        with col2:
            deadline = st.date_input("Exam Deadline")
            
        if st.button("🔮 Generate Study Plan"):
            with st.spinner("Building your roadmap..."):
                prompt = f"Create a study plan for these topics: {topics}. Hours/day: {hours}. Deadline: {deadline}."
                res = get_career_insight(prompt)
                st.markdown(f"<div class='info-box'>{res}</div>", unsafe_allow_html=True)
                save_to_history(st.session_state.email, st.session_state.user_name, "Study Planner", f"Plan for {deadline}", res)
        st.markdown("</div>", unsafe_allow_html=True)

def render_history():
    st.markdown("<h1>🕒 Your History</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #94a3b8;'>Review your past learning and preparation sessions.</p>", unsafe_allow_html=True)
    
    data = load_history(st.session_state.email)
    if not data:
        st.info("Your history will appear here as you use the Smart AI features.")
    else:
        for item in data:
            with st.container():
                st.markdown(f"""
                <div class='card' style='margin-bottom: 1rem;'>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #3b82f6;">{item.get('feature', 'Entry')}</span>
                        <span style="font-size: 0.8rem; color: #94a3b8;">{item['timestamp']}</span>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #cbd5e1;">{item.get('input', 'N/A')}</div>
                    <div style="margin-top: 1rem; padding: 10px; background: #0f172a; border-radius: 8px; font-size: 0.85rem; max-height: 150px; overflow-y: auto;">
                        {item.get('result', '')}
                    </div>
                </div>
                """, unsafe_allow_html=True)

# ---------------- MAIN APP WRAPPER ----------------
def main():
    apply_custom_styles()
    
    # Initialize Page State
    if 'active_page' not in st.session_state:
        st.session_state.active_page = 'Dashboard'
        
    sidebar_nav()
    
    # Page Routing
    if st.session_state.active_page == "Dashboard":
        render_dashboard()
    elif st.session_state.active_page == "Interview Prep":
        render_interview_prep()
    elif st.session_state.active_page == "Quiz Generator":
        render_quiz_generator()
    elif st.session_state.active_page == "Concept Explainer":
        render_concept_explainer()
    elif st.session_state.active_page == "Study Planner":
        render_study_planner()
    elif st.session_state.active_page == "History":
        render_history()

def auth_overlay():
    apply_custom_styles()
    st.markdown("<div style='max-width: 450px; margin: auto; padding: 50px 0;'>", unsafe_allow_html=True)
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.title("🛡️ Smart AI Access")
    choice = st.radio("Access Mode", ["Login", "Register"], horizontal=True)
    e = st.text_input("GMRIT Email")
    p = st.text_input("Password", type="password")
    
    if choice == "Register":
        n = st.text_input("Full Name")
        b = st.selectbox("Branch", ["CSE", "IT", "ECE", "MECH", "EEE", "CIVIL"])
        if st.button("🚀 Create Account"):
            ok, msg = register_user(n, e, p, b)
            if ok: st.success("Created! Now Login.")
            else: st.error(msg)
    else:
        if st.button("🔑 Login"):
            u = login_user(e, p)
            if u:
                st.session_state.logged_in = True
                st.session_state.email = u.get('email', e)
                st.session_state.user_name = u.get('name', 'GMRIT Student')
                st.session_state.user_branch = u.get('branch', 'CSE')
                st.rerun()
            else: st.error("Access Refused!")
    st.markdown("</div></div>", unsafe_allow_html=True)

if __name__ == "__main__":
    if 'logged_in' not in st.session_state: st.session_state.logged_in = False
    if not st.session_state.logged_in:
        auth_overlay()
    else:
        main()