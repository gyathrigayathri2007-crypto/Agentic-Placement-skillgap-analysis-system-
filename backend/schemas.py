from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

# ── AUTH SCHEMAS ─────────────────────────────────────────────
class RoleEnum(str, Enum):
    student = "student"
    faculty = "faculty"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str

    class Config:
        from_attributes = True

# ── SKILL SCHEMAS ─────────────────────────────────────────────
class SkillBase(BaseModel):
    skill_name: str

class SkillResponse(SkillBase):
    id: str
    class Config:
        from_attributes = True

# ── PROJECT SCHEMAS ───────────────────────────────────────────
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    class Config:
        from_attributes = True

# ── INTERNSHIP SCHEMAS ────────────────────────────────────────
class InternshipBase(BaseModel):
    company: str
    role: str

class InternshipResponse(InternshipBase):
    id: str
    class Config:
        from_attributes = True

# ── STUDENT PROFILE SCHEMAS ───────────────────────────────────
class StudentProfileCreate(BaseModel):
    name: str
    department: str
    year: str
    section: str
    cgpa: float
    leetcode_count: Optional[int] = 0
    hackerrank_score: Optional[int] = 0
    codechef_rating: Optional[int] = None
    codeforces_rating: Optional[int] = None
    resume_url: Optional[str] = None
    certification_urls: Optional[List[str]] = []
    skills: List[str] = []
    projects: List[ProjectBase] = []
    internships: List[InternshipBase] = []

class StudentProfileUpdate(StudentProfileCreate):
    pass

class StudentResponse(BaseModel):
    id: str
    name: str
    department: Optional[str]
    year: Optional[str]
    section: Optional[str]
    cgpa: Optional[float]
    leetcode_count: Optional[int]
    hackerrank_score: Optional[int]
    codechef_rating: Optional[int]
    codeforces_rating: Optional[int]
    resume_url: Optional[str]
    certification_urls: Optional[List]
    profile_completed: bool
    readiness_score: float
    skills: List[SkillResponse] = []
    projects: List[ProjectResponse] = []
    internships: List[InternshipResponse] = []

    class Config:
        from_attributes = True

# ── COMPANY SCHEMAS ───────────────────────────────────────────
class CompanyCreate(BaseModel):
    name: str
    required_skills: List[str] = []
    cgpa_cutoff: float
    aptitude_requirement: Optional[str] = None
    certifications_required: Optional[str] = None
    package: Optional[str] = None

class CompanyUpdate(CompanyCreate):
    pass

class CompanyResponse(BaseModel):
    id: str
    name: str
    required_skills: Optional[List] = []
    cgpa_cutoff: float
    aptitude_requirement: Optional[str]
    certifications_required: Optional[str]
    package: Optional[str]

    class Config:
        from_attributes = True

# ── ELIGIBILITY SCHEMAS ───────────────────────────────────────
class EligibilityResponse(BaseModel):
    company_id: str
    company_name: str
    package: Optional[str]
    status: str
    skill_gap: Optional[dict] = {}

    class Config:
        from_attributes = True

# ── DASHBOARD SCHEMAS ─────────────────────────────────────────
class ProgressResponse(BaseModel):
    readiness_score: float
    recorded_at: str

    class Config:
        from_attributes = True

class DashboardResponse(BaseModel):
    student: StudentResponse
    readiness_score: float
    companies: List[EligibilityResponse]
    progress: List[ProgressResponse]

# ── AI SCHEMAS ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class RecommendationResponse(BaseModel):
    company_id: str
    roadmap: str
    generated_at: Optional[str]

    class Config:
        from_attributes = True

# ── FACULTY SCHEMAS ───────────────────────────────────────────
class StudentListResponse(BaseModel):
    id: str
    name: str
    department: Optional[str]
    year: Optional[str]
    section: Optional[str]
    cgpa: Optional[float]
    readiness_score: float
    skills_count: int
    eligible_companies_count: int

    class Config:
        from_attributes = True

class FacultyStatsResponse(BaseModel):
    total_students: int
    total_companies: int
    above_75_count: int
    avg_readiness_score: float