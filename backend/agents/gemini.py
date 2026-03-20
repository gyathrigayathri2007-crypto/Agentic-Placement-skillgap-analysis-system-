import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# ── CHAT RESPONSE ─────────────────────────────────────────────
def get_chat_response(message: str, history: list = []) -> str:
    try:
        system_prompt = """You are a smart placement preparation assistant 
        for engineering students in India. Help with:
        - Interview preparation tips
        - Coding practice guidance  
        - Skill development roadmaps
        - Company-specific advice
        - Resume building tips
        Be concise, practical, and encouraging."""

        conversation = f"{system_prompt}\n\n"

        for h in history[-5:]:
            conversation += f"Student: {h['message']}\nAssistant: {h['response']}\n\n"

        conversation += f"Student: {message}\nAssistant:"

        response = model.generate_content(conversation)
        return response.text

    except Exception as e:
        return f"Sorry, I could not process your request right now. Error: {str(e)}"

# ── RECOMMENDATION RESPONSE ───────────────────────────────────
def get_recommendation(
    student_skills: list,
    company_name: str,
    required_skills: list,
    gap_skills: list
) -> str:
    try:
        prompt = f"""
        A student wants to get placed at {company_name}.
        
        Student's current skills: {', '.join(student_skills) if student_skills else 'None listed'}
        
        Company requires: {', '.join(required_skills) if required_skills else 'General skills'}
        
        Missing skills to learn: {', '.join(gap_skills) if gap_skills else 'None - student meets requirements'}
        
        Please provide:
        1. LEARNING ROADMAP (week by week plan for 8 weeks)
        2. BEST PRACTICE PLATFORMS (with specific links or names)
        3. MINI PROJECT IDEAS (3 projects to build these skills)
        4. INTERVIEW TIPS specific to {company_name}
        
        Format your response clearly with these 4 sections.
        Be specific and actionable.
        """

        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        return f"Could not generate recommendation right now. Error: {str(e)}"