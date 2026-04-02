import streamlit as st
import google.generativeai as genai
from groq import Groq

# ====================== CONFIG ======================
st.set_page_config(page_title="QuickAI Chat", page_icon="🚀", layout="wide")
st.title("🚀 QuickAI Chat - Practice App")
st.caption("Gemini + Groq + Streamlit | Ready for tomorrow's hackathon")

# Sidebar
st.sidebar.header("⚙️ Settings")
model_choice = st.sidebar.radio("Choose AI Model", ["Gemini (Smart + Vision)", "Groq (Super Fast)"])

# API Keys from Secrets (we will set this later)
gemini_key = st.secrets.get("GEMINI_API_KEY")
groq_key = st.secrets.get("GROQ_API_KEY")

if not gemini_key or not groq_key:
    st.error("❌ API keys not found in secrets. Follow Step 5.")
    st.stop()

# Initialize clients
genai.configure(api_key=gemini_key)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')   # Fast & good
groq_client = Groq(api_key=groq_key)

# Language
language = st.sidebar.selectbox("Language", ["English", "Telugu"])

# ====================== CHAT ======================
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# File uploader (only for Gemini)
uploaded_file = st.file_uploader("Upload Image or PDF (Gemini only)", type=["jpg", "jpeg", "png", "pdf"])

# User input
user_input = st.chat_input("Ask anything...")

if user_input:
    # Add user message
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    # Prepare prompt
    prompt = user_input
    if language == "Telugu":
        prompt = f"ఇది తెలుగులో జవాబు ఇవ్వు: {user_input}"

    # Call the chosen model
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            if model_choice == "Gemini (Smart + Vision)" and uploaded_file is not None:
                # Vision support
                file_bytes = uploaded_file.getvalue()
                response = gemini_model.generate_content([prompt, {"mime_type": uploaded_file.type, "data": file_bytes}])
                answer = response.text
            elif model_choice == "Gemini (Smart + Vision)":
                response = gemini_model.generate_content(prompt)
                answer = response.text
            else:
                # Groq
                completion = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                )
                answer = completion.choices[0].message.content

            st.markdown(answer)
            st.session_state.messages.append({"role": "assistant", "content": answer})