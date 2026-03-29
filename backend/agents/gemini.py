import google.generativeai as genai
import time
import warnings
warnings.filterwarnings("ignore")

from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

# ── Models to try in order ────────────────────────────────────
MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]

\



# ── LOCAL FALLBACK RESPONSES ──────────────────────────────────
# Used when Gemini API quota is exhausted
LOCAL_RESPONSES = {
    # DSA / Coding
    "dsa": """📚 **DSA Preparation Guide:**

• **Arrays & Strings** (Week 1–2): LeetCode Easy → Medium
• **Linked Lists, Stacks, Queues** (Week 3): Must know reversal, cycle detection
• **Trees & Graphs** (Week 4–5): BFS, DFS, binary tree traversals
• **Dynamic Programming** (Week 6–8): Start with fibonacci, knapsack, LCS

**Best Platforms:**
→ LeetCode (https://leetcode.com) — solve 150+ problems
→ HackerRank (https://hackerrank.com) — language certifications
→ NPTEL DSA course (https://nptel.ac.in/courses/106102064)

**Target:** 2 problems daily minimum for 3 months.""",

    "leetcode": """💻 **LeetCode Strategy for Placements:**

• Start with **LeetCode Top 150** interview questions list
• Follow this order: Arrays → Two Pointers → Sliding Window → Stack → Binary Search → Trees → Graphs → DP
• **Time yourself** — aim to solve Easy in 15 min, Medium in 30 min
• After solving, always read the top 3 solutions in Discuss tab

**Company-wise Lists:**
→ TCS / Infosys: Focus on Easy/Medium only
→ Zoho: Medium-Heavy focus on algorithms
→ Amazon/Flipkart: Medium-Hard, DP and Graphs heavy

Practice 2 problems daily — consistency beats intensity.""",

    "python": """🐍 **Python Learning Roadmap:**

**Week 1–2:** Basics — variables, loops, functions, lists, dicts
**Week 3:** OOP — classes, inheritance, decorators
**Week 4:** Standard library — collections, itertools, os, re
**Week 5–6:** Practice 30 HackerRank Python challenges
**Week 7–8:** Build a project using Python (Flask API, data analysis, automation)

**Best Resources:**
→ Python for Everybody – Coursera (https://coursera.org/specializations/python)
→ HackerRank Python (https://hackerrank.com/domains/python)
→ NPTEL Python (https://nptel.ac.in/courses/106106182)

Python is required by 80% of product companies in India. Master it!""",

    "tcs": """🏢 **TCS NQT Preparation Guide:**

**Test Structure:** Aptitude + Reasoning + Verbal + Coding
**Coding Section:** 2 problems in 60 min (Easy-Medium level)

**Topics to cover:**
• Aptitude: Percentages, Time-Speed-Distance, Profit/Loss, Series
• Reasoning: Blood relations, syllogisms, arrangements
• Verbal: Reading comprehension, grammar, vocabulary
• Coding: Arrays, strings, sorting — Python or Java

**Resources:**
→ IndiaBix (https://indiabix.com) — daily aptitude practice
→ TCS iON (https://tcsion.com) — official mock tests
→ GeeksForGeeks TCS page for company-specific questions

**CGPA Cutoff:** Usually 6.0 or 7.0 depending on year. Check JD carefully.""",

    "infosys": """🏢 **Infosys Preparation Guide:**

**Test:** InfyTQ Platform + HackWithInfy for on-campus

**Focus Areas:**
• Aptitude (strong — InfyTQ tests are harder than TCS)
• Reasoning — puzzles, seating arrangements
• Verbal — reading comprehension
• Coding — 3 problems, 90 min

**Tips:**
→ Register on InfyTQ (https://infytq.onlineassessment.in) and complete all modules
→ Solve HackerRank 30 Days of Code
→ Learn any one language deeply (Java or Python preferred)
→ CGPA cutoff: Usually 6.5

Infosys values communication in interviews — practice speaking clearly.""",

    "zoho": """🏢 **Zoho Interview Preparation:**

Zoho is known for having one of the **toughest technical rounds** in India.

**Selection Process:** Written Test → Technical Round 1 → Technical Round 2 → HR

**What they test:**
• OOP concepts deeply (Encapsulation, Polymorphism, Inheritance)
• DSA — Linked lists, trees, recursion heavily
• SQL — Complex queries, joins
• Problem-solving speed under pressure
• **Custom-built products** — they value creative thinking

**Tips:**
→ Know your chosen language (Java/Python/C++) deeply
→ Practice writing code on paper — no IDE in rounds
→ Study OOP design patterns
→ Build 2–3 solid projects using their tech stack

Zoho pays very well (7–12 LPA for freshers) but selection rate is low — prepare harder.""",

    "resume": """📄 **Fresher Resume Tips:**

**One-pager rule** — Keep it strictly 1 page

**Sections in order:**
1. Name + Contact (email, phone, LinkedIn, GitHub)
2. Objective/Summary (2 lines max)
3. Education (CGPA, year, college, branch)
4. Skills (Languages, Frameworks, Tools, Databases)
5. Projects (3 best — title, tech stack, 2-line description + GitHub link)
6. Internships (if any)
7. Certifications (NPTEL, HackerRank, Coursera with credential links)
8. Achievements (Hackathons, competitive programming ranks)

**Key Mistakes to Avoid:**
→ Don't use Objective like "Seeking a challenging role..." — be specific
→ Quantify achievements: "Built a REST API that handles 1000+ requests" not "Built API"
→ Match skills to the JD you're applying for
→ GitHub link is mandatory for tech roles

Use a clean template. ATS (Applicant Tracking System) prefers simple formatting over fancy designs.""",

    "aptitude": """🧮 **Aptitude Preparation Strategy:**

**Topics by Priority:**

🔴 Critical — Practice Daily:
• Percentages, Profit & Loss, Simple & Compound Interest
• Time, Speed & Distance | Time & Work
• Number Series & Sequences

🟡 Important — Practice Weekly:
• Probability & Permutations/Combinations
• Blood Relations, Syllogisms
• Seating Arrangements, Direction Sense

🟢 Verbal — Practice Regularly:
• Reading Comprehension (timed)
• Sentence Correction, Fill in the Blanks
• Synonyms/Antonyms

**Resources:**
→ IndiaBix (https://indiabix.com) — best free resource
→ RS Aggarwal Quantitative Aptitude book
→ PrepInsta topic-wise tests

**Target:** 30 min of aptitude practice EVERY day. It compounds fast over weeks.""",

    "cgpa": """📊 **CGPA in Placements — Honest Guide:**

**Company-wise CGPA cutoffs (approx):**
• TCS, Infosys, Wipro, Cognizant: **6.0–7.0 CGPA** (active backlogs = rejection)
• Accenture, Capgemini: **6.5 CGPA**, some allow 6.0
• Zoho, Freshworks: **7.0+ preferred** but merit matters more
• Amazon, Google, Microsoft: **No strict cutoff** — coding skills matter most

**If your CGPA is low:**
→ Fill the gap with strong projects, GitHub, certifications
→ HackerRank 5-star Gold badge matters more than 0.1 CGPA  
→ Active backlogs are more harmful than low CGPA — clear them first
→ Many companies have "aggregate" vs "all semester" calculation — know which applies

**Bottom line:** CGPA opens doors, but skills keep you inside. A 6.5 with 100+ LeetCode problems beats an 8.5 with zero coding practice in product interviews.""",

    "skill gap": """🎯 **Your Skill Gap & What To Do:**

Based on your profile analysis in this system:

**Step 1:** Check your dashboard → Companies tab → see which companies show as "Near Eligible"
**Step 2:** Go to the Skills page → "Recommended" tab → see priority-ranked missing skills
**Step 3:** Focus on top 3 missing skills first — don't try to learn everything

**General Priority Order for Freshers:**
1. DSA + Problem Solving (opens all doors)
2. Core CS subjects (OS, DBMS, CN) — required for service companies
3. One programming language deeply (Python or Java)
4. SQL (quick to learn, high impact)
5. One framework (React for frontend, Spring Boot / FastAPI for backend)

**Time Estimate:**
→ 3 months of focused prep = significant improvement in readiness score
→ Update your profile after learning to re-trigger AI analysis

Go to Profile Edit → update the skills you've learned → AI will reanalyze and update your score!""",

    "project": """🛠️ **Project Ideas to Boost Placement Chances:**

**Tier 1 — Beginner (For service companies):**
• Student Grade Calculator (Python, file handling)
• Library Management System (Java + MySQL)
• Simple Weather App (Python + API calls)

**Tier 2 — Intermediate (For product companies):**
• Expense Tracker Web App (React + FastAPI/Node + MySQL)
• Quiz App with scoreboard (React + backend API)
• URL Shortener (Python/Java + database)
• Chat Application (WebSockets + any backend)

**Tier 3 — Advanced (For top product companies):**
• E-commerce Website (full stack with payments)
• Real-time Chat with AI integration (like this placement system!)
• Machine Learning model deployed as API

**Key Rules for Projects:**
→ Push everything to GitHub — no GitHub = project doesn't count
→ Write a proper README with screenshots
→ Deploy it (Netlify for frontend, Render/Railway for backend — both free)
→ Be prepared to explain every line of code in interviews""",

    "default": """I'm your AI placement assistant! Here's how I can help you:

📌 **Ask me about:**
• DSA preparation and LeetCode strategy
• Company-specific prep: TCS, Infosys, Zoho, Amazon, Wipro
• Resume writing tips for freshers  
• Aptitude and verbal preparation
• Python, Java, SQL learning roadmaps
• Project ideas and GitHub tips
• CGPA requirements and eligibility
• Skill gap analysis and what to study next
• Interview tips, HR rounds, offer negotiation

💡 **Try asking:**
→ "How do I prepare for TCS NQT?"
→ "Give me a Python learning roadmap"
→ "What projects should I build?"
→ "How important is CGPA for Amazon?"

Type your question and I'll give you a detailed, practical answer!"""
}


def _get_local_response(message: str) -> str:
    """Rule-based local responses for common placement questions."""
    msg = message.lower()

    if any(k in msg for k in ["dsa", "data structure", "algorithm", "linked list", "tree", "graph", "dynamic programming", "dp "]):
        return LOCAL_RESPONSES["dsa"]
    if any(k in msg for k in ["leetcode", "leet code", "coding problem", "competitive"]):
        return LOCAL_RESPONSES["leetcode"]
    if any(k in msg for k in ["python", "numpy", "pandas", "flask", "django"]):
        return LOCAL_RESPONSES["python"]
    if any(k in msg for k in ["tcs", "nqt", "infytq"]):
        return LOCAL_RESPONSES["tcs"]
    if any(k in msg for k in ["infosys", "infy"]):
        return LOCAL_RESPONSES["infosys"]
    if any(k in msg for k in ["zoho"]):
        return LOCAL_RESPONSES["zoho"]
    if any(k in msg for k in ["resume", "cv ", "curriculum vitae"]):
        return LOCAL_RESPONSES["resume"]
    if any(k in msg for k in ["aptitude", "quantitative", "reasoning", "verbal", "indiabix", "quant"]):
        return LOCAL_RESPONSES["aptitude"]
    if any(k in msg for k in ["cgpa", "gpa", "percentage", "backlog", "arrear"]):
        return LOCAL_RESPONSES["cgpa"]
    if any(k in msg for k in ["skill gap", "missing skill", "what skill", "which skill", "skill to learn"]):
        return LOCAL_RESPONSES["skill gap"]
    if any(k in msg for k in ["project", "build", "github", "portfolio", "deploy"]):
        return LOCAL_RESPONSES["project"]

    return None  # No local response — let it try Gemini


def _try_gemini(prompt: str) -> str | None:
    """Try Gemini API. Returns text on success, None on quota/failure."""
    for model_name in MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            err = str(e)
            if "429" in err or "quota" in err.lower() or "rate" in err.lower():
                continue   # Try next model
            # Non-quota error (404 model not found, auth error) — skip
            continue
    return None  # All models failed


# ── CHAT RESPONSE ──────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert AI placement preparation assistant for engineering students in India.

ONLY answer questions related to:
- Technical interview preparation (DSA, coding, system design)
- Skill development and learning roadmaps  
- Company-specific preparation (TCS, Infosys, Zoho, Amazon, Wipro, Freshworks, etc.)
- Resume writing, aptitude tests, HR rounds, GD preparation
- Career guidance, CGPA, backlogs, eligibility criteria
- Specific programming languages, frameworks, tools

If asked anything unrelated to placements/career/study, politely say you can only help with placement preparation.
Be concise, practical, and encouraging. Use bullet points. Keep responses under 300 words."""


def get_chat_response(message: str, history: list = []) -> str:
    # 1. Try local response first for very common questions
    local = _get_local_response(message)

    # 2. Try Gemini API
    prompt = SYSTEM_PROMPT + "\n\n"
    for h in history[-4:]:
        prompt += f"Student: {h['message']}\nAssistant: {h['response']}\n\n"
    prompt += f"Student: {message}\nAssistant:"

    gemini_response = _try_gemini(prompt)

    if gemini_response:
        return gemini_response  # Gemini worked — return AI response

    # 3. Gemini failed — use local response if available
    if local:
        return local + "\n\n_(Note: AI is temporarily unavailable due to API quota limits. This is a pre-built guidance response.)_"

    # 4. Both failed — return helpful default
    return LOCAL_RESPONSES["default"] + "\n\n_(Note: AI is temporarily unavailable due to API quota limits. Pre-built responses are available for common topics.)_"


# ── RECOMMENDATION RESPONSE ────────────────────────────────────
def get_recommendation(
    student_skills: list,
    company_name: str,
    required_skills: list,
    gap_skills: list
) -> str:
    prompt = f"""You are a placement expert. A student wants to get placed at {company_name} in India.

Student's current skills: {', '.join(student_skills) if student_skills else 'None listed'}
Company requires: {', '.join(required_skills) if required_skills else 'General software skills'}
Missing skills: {', '.join(gap_skills) if gap_skills else 'None — student meets all requirements'}

Provide:
1. LEARNING ROADMAP (8-week plan)
2. BEST PLATFORMS (LeetCode, HackerRank, NPTEL, Coursera — with specific names)
3. MINI PROJECT IDEAS (3 projects)
4. INTERVIEW TIPS for {company_name}

Be specific and practical for Indian freshers."""

    result = _try_gemini(prompt)
    if result:
        return result

    # Fallback roadmap when API is unavailable
    gap_str = ', '.join(gap_skills[:5]) if gap_skills else 'your profile skills'
    return f"""**Learning Roadmap for {company_name}**

**Skills to focus on:** {gap_str}

**8-Week Plan:**
Week 1–2: Study fundamentals of {gap_skills[0] if gap_skills else 'DSA'}
Week 3–4: Solve 30 LeetCode problems related to these skills
Week 5–6: Build a mini project using {gap_skills[0] if gap_skills else 'Python/Java'}
Week 7: Company-specific mock tests and aptitude practice
Week 8: Resume update + mock interviews

**Resources:**
→ LeetCode: https://leetcode.com
→ HackerRank: https://hackerrank.com
→ NPTEL: https://nptel.ac.in
→ Coursera: https://coursera.org

**For {company_name} Specifically:**
→ Check their official careers page for job descriptions
→ GeeksForGeeks has company-wise interview questions
→ Practice typing code without IDE (many companies use paper/whiteboard)

_(AI recommendation engine is temporarily unavailable. This is an auto-generated roadmap.)_"""