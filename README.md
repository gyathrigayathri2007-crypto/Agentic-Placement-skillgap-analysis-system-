# Smart Placement Management System
### Agentic AI-Based Placement System

---

## What is This Project?

A full-stack web application that helps engineering students prepare for campus placements using AI. Students get personalized eligibility analysis, skill gap detection, and learning roadmaps powered by Google Gemini AI. Faculty can monitor all students and plan targeted training.

---

## Two User Roles

| Role | What They Can Do |
|---|---|
| Student | Fill profile, see eligibility, get AI recommendations, chat with AI assistant |
| Faculty | View all students, monitor scores, add companies, download reports |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS *(not built yet)* |
| Backend | Python 3.13 + FastAPI |
| Database | MySQL 8.0 |
| ORM | SQLAlchemy |
| Authentication | JWT Tokens + Bcrypt |
| AI | Google Gemini API (gemini-1.5-flash) |
| File Storage | Cloudinary |
| Excel Export | Pandas + OpenPyXL |

---

## Project Folder Structure

```
C:\agentic placement\
└── backend\
    ├── venv\                    ← Python virtual environment
    ├── .env                     ← All secret keys (never share this)
    ├── .vscode\
    │   └── settings.json        ← VS Code settings
    ├── main.py                  ← FastAPI app entry point
    ├── config.py                ← Reads .env settings
    ├── database.py              ← MySQL connection
    ├── models.py                ← All 10 database tables
    ├── schemas.py               ← Request/response formats
    ├── auth.py                  ← JWT + password hashing
    ├── routers\
    │   ├── auth.py              ← Login, register, logout
    │   ├── students.py          ← Student profile + dashboard
    │   ├── companies.py         ← Company CRUD
    │   ├── faculty.py           ← Faculty dashboard + export
    │   └── ai.py                ← Gemini chat + recommendations
    ├── agents\
    │   ├── pipeline.py          ← Main AI agent orchestrator
    │   ├── eligibility.py       ← Eligibility matching logic
    │   ├── skill_gap.py         ← Skill gap calculation
    │   └── gemini.py            ← Gemini API wrapper
    └── utils\
        ├── cloudinary.py        ← File upload helper
        └── export.py            ← Excel report generator
```

---

## Database Tables

```
smart_placement_db
├── users                ← Login info for both students and faculty
├── students             ← Student profile details
├── skills               ← Each student's skills
├── projects             ← Each student's projects
├── internships          ← Each student's internships
├── companies            ← Companies added by faculty
├── eligibility_results  ← Which company suits which student
├── recommendations      ← Gemini AI generated roadmaps
├── progress_tracking    ← Student readiness score history
└── chat_history         ← AI chat conversations
```

---

## Environment Variables (.env)

```env
DATABASE_URL=mysql+pymysql://root:Gayu300116@localhost:3306/smart_placement_db
GEMINI_API_KEY=your_gemini_key_here
SECRET_KEY=mysecretkey123456789anylongstring
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CLOUDINARY_CLOUD_NAME=dau4c9a2j
CLOUDINARY_API_KEY=949344365451218
CLOUDINARY_API_SECRET=your_cloudinary_secret_here
ALLOWED_ORIGINS=http://localhost:5173
```

> ⚠️ Never share your .env file with anyone or push it to GitHub.

---

## How to Start the Backend

```bash
# Step 1 - Go to backend folder
cd "C:\agentic placement\backend"

# Step 2 - Activate virtual environment
venv\Scripts\activate

# Step 3 - Start the server
uvicorn main:app --reload --port 8000
```

**Check it works:**
- http://localhost:8000 → Should show `{"message":"Smart Placement API is running!"}`
- http://localhost:8000/docs → Swagger UI to test all routes

---

## All API Routes

### Authentication
| Method | Route | Who | What |
|---|---|---|---|
| POST | /api/auth/register | Anyone | Register as student or faculty |
| POST | /api/auth/login | Anyone | Login and get cookie |
| POST | /api/auth/logout | Anyone | Logout and clear cookie |
| GET | /api/auth/me | Logged in | Get current user info |

### Students
| Method | Route | Who | What |
|---|---|---|---|
| POST | /api/students/profile | Student | Create profile + triggers AI |
| PUT | /api/students/profile | Student | Update profile + re-triggers AI |
| GET | /api/students/profile | Student | View own profile |
| GET | /api/students/dashboard | Student | Full dashboard data |

### Companies
| Method | Route | Who | What |
|---|---|---|---|
| GET | /api/companies/ | All | List all companies |
| POST | /api/companies/ | Faculty | Add new company |
| GET | /api/companies/{id} | All | View one company |
| PUT | /api/companies/{id} | Faculty | Edit company |
| DELETE | /api/companies/{id} | Faculty | Delete company |

### Faculty
| Method | Route | Who | What |
|---|---|---|---|
| GET | /api/faculty/stats | Faculty | Dashboard numbers |
| GET | /api/faculty/students | Faculty | All students with filters |
| GET | /api/faculty/students/{id} | Faculty | One student full detail |
| GET | /api/faculty/export | Faculty | Download Excel report |
| GET | /api/faculty/registered | Faculty | Registered students |

### AI
| Method | Route | Who | What |
|---|---|---|---|
| POST | /api/ai/chat | Student | Chat with Gemini AI |
| GET | /api/ai/recommendations/{id} | Student | Get AI roadmap for a company |

---

## How the AI Pipeline Works

When a student submits their profile, 5 agents run automatically in the background:

```
Student submits profile
         ↓
Agent 1 → Student Profiling
          Reads all student data

Agent 2 → Eligibility Matching
          Compares student vs every company
          • cgpa >= cutoff AND 50%+ skills = Eligible ✅
          • cgpa >= cutoff-0.5 AND 30%+ skills = Near Eligible 🟡
          • Everything else = Not Eligible ❌

Agent 3 → Skill Gap Calculation
          For each required skill:
          • Student has it  → level shown as 60/85
          • Student missing → level shown as 0/85

Agent 4 → Gemini AI Recommendations
          Generates for Eligible + Near Eligible companies:
          • 8-week learning roadmap
          • Practice platforms
          • Mini project ideas
          • Interview tips

Agent 5 → Readiness Score
          Formula (0-100%):
          • CGPA        → 30%
          • LeetCode    → 25%
          • Skills      → 20%
          • Projects    → 15%
          • Internships → 10%
```

---

## Python Packages Installed

```
fastapi
uvicorn
sqlalchemy
pymysql
cryptography
python-dotenv
python-jose[cryptography]
passlib==1.7.4
bcrypt==4.0.1
google-generativeai
cloudinary
python-multipart
pandas
openpyxl
httpx
pydantic-settings
pydantic[email]
email-validator
```

---

## Current Status

| Part | Status |
|---|---|
| MySQL Database (10 tables) | ✅ Done |
| Backend API (17 files) | ✅ Done |
| Agentic AI Pipeline | ✅ Done |
| Gemini AI Integration | ✅ Done |
| JWT Authentication | ✅ Done |
| Excel Export | ✅ Done |
| React Frontend | ❌ Not started yet |
| Cloudinary File Upload | ⚠️ Ready but not tested |
| Microsoft OAuth Login | ❌ Not implemented yet |

---

## Frontend Pages to Build (Next Step)

```
1. Login Page
   → Role selector (Student / Faculty)
   → Email + Password form

2. Student Profile Setup (5-step form)
   → Basic Details
   → Academic + Skills
   → Projects + Internships
   → Coding Platforms
   → File Uploads + Terms

3. Student Dashboard
   → Readiness score circular chart
   → Company eligibility cards
   → Skill gap bar charts
   → AI recommendations per company

4. AI Chat Assistant
   → Full chat interface
   → Powered by Gemini AI

5. Student Profile Edit
   → Same form pre-filled

6. Faculty Dashboard
   → Stats cards
   → Student list with filters
   → Student detail view
   → Excel download button

7. Faculty Companies Page
   → Add / Edit / View companies

8. Faculty Registered Students
   → Students registered for placement
```

---

## Frontend Tech to Install

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom zustand tailwindcss
npm install react-query react-hook-form recharts lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-tabs
```

### Frontend .env
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CLOUDINARY_CLOUD_NAME=dau4c9a2j
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## How Frontend Connects to Backend

```
Frontend (React) runs on  → http://localhost:5173
Backend (FastAPI) runs on → http://localhost:8000

All API calls use axios with:
  baseURL: http://localhost:8000
  withCredentials: true  ← Important for cookies to work
```

---

## Future Plans

```
Phase 1 → React Website          ← Next step
Phase 2 → Deploy online          ← After website done
           Backend  → Render.com (free)
           Frontend → Vercel (free)
           Database → PlanetScale or Clever Cloud (free MySQL)
Phase 3 → Mobile App             ← Future
           React Native (reuse React knowledge)
           Same backend, zero changes needed
```

---

## Quick Test Checklist

Use http://localhost:8000/docs to test:

- [ ] Register faculty → `POST /api/auth/register` (role: faculty)
- [ ] Login as faculty → `POST /api/auth/login`
- [ ] Add company → `POST /api/companies/`
- [ ] Register student → `POST /api/auth/register` (role: student)
- [ ] Login as student → `POST /api/auth/login`
- [ ] Create student profile → `POST /api/students/profile`
- [ ] Check terminal → AI pipeline logs should appear
- [ ] Get dashboard → `GET /api/students/dashboard`
- [ ] Check MySQL → `SELECT * FROM eligibility_results;`

---

*Built with FastAPI + MySQL + Google Gemini AI*