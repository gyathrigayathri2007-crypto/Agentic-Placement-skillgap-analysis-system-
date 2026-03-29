import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, JSON, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

# ── TABLE 1: USERS ──────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = Column(String(36), primary_key=True, default=generate_uuid)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    role          = Column(Enum("student", "faculty"), nullable=False)
    auth_provider = Column(Enum("local", "microsoft"), default="local")
    microsoft_id  = Column(String(255), nullable=True, unique=True)
    created_at    = Column(TIMESTAMP, server_default=func.now())

    student = relationship("Student", back_populates="user", uselist=False)


# ── TABLE 2: STUDENTS ────────────────────────────────────────
class Student(Base):
    __tablename__ = "students"

    # Student.id == User.id (same UUID, FK relationship)
    id                 = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    name               = Column(String(255), nullable=False)
    department         = Column(String(100))
    year               = Column(String(20))
    section            = Column(String(20))
    cgpa               = Column(Float)
    leetcode_count     = Column(Integer, default=0)
    hackerrank_score   = Column(Integer, default=0)
    codechef_rating    = Column(Integer, nullable=True)
    codeforces_rating  = Column(Integer, nullable=True)
    resume_url         = Column(Text, nullable=True)
    certification_urls = Column(JSON, default=list)
    profile_completed  = Column(Boolean, default=False)
    readiness_score    = Column(Float, default=0)
    created_at         = Column(TIMESTAMP, server_default=func.now())
    updated_at         = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user               = relationship("User", back_populates="student")
    skills             = relationship("Skill", back_populates="student", cascade="all, delete")
    projects           = relationship("Project", back_populates="student", cascade="all, delete")
    internships        = relationship("Internship", back_populates="student", cascade="all, delete")
    eligibility_results = relationship("EligibilityResult", back_populates="student", cascade="all, delete")
    recommendations    = relationship("Recommendation", back_populates="student", cascade="all, delete")
    progress_tracking  = relationship("ProgressTracking", back_populates="student", cascade="all, delete")
    chat_history       = relationship("ChatHistory", back_populates="student", cascade="all, delete")


# ── TABLE 3: SKILLS ──────────────────────────────────────────
class Skill(Base):
    __tablename__ = "skills"

    id           = Column(String(36), primary_key=True, default=generate_uuid)
    student_id   = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    skill_name   = Column(String(100), nullable=False)

    # ── NEW ──────────────────────────────────────────────────
    # Stores proof of learning per skill.
    # Shape: {
    #   "certificate_url": "https://...",
    #   "learned_at": "2025-01-15T10:30:00",
    #   "source": "self_marked" | "profile_import",
    #   "verified": false
    # }
    # Default is None (no proof). Added without breaking existing rows.
    skill_metadata = Column(JSON, nullable=True, default=None)
    # ─────────────────────────────────────────────────────────

    student = relationship("Student", back_populates="skills")


# ── TABLE 4: PROJECTS ────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    id          = Column(String(36), primary_key=True, default=generate_uuid)
    student_id  = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    student = relationship("Student", back_populates="projects")


# ── TABLE 5: INTERNSHIPS ─────────────────────────────────────
class Internship(Base):
    __tablename__ = "internships"

    id         = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    company    = Column(String(255), nullable=False)
    role       = Column(String(255), nullable=False)

    student = relationship("Student", back_populates="internships")


# ── TABLE 6: COMPANIES ───────────────────────────────────────
class Company(Base):
    __tablename__ = "companies"

    id                       = Column(String(36), primary_key=True, default=generate_uuid)
    name                     = Column(String(255), nullable=False)
    required_skills          = Column(JSON, default=list)
    cgpa_cutoff              = Column(Float, nullable=False)
    aptitude_requirement     = Column(Text, nullable=True)
    certifications_required  = Column(Text, nullable=True)
    package                  = Column(String(100), nullable=True)
    created_by               = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at               = Column(TIMESTAMP, server_default=func.now())
    updated_at               = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    eligibility_results = relationship("EligibilityResult", back_populates="company", cascade="all, delete")
    recommendations     = relationship("Recommendation", back_populates="company", cascade="all, delete")


# ── TABLE 7: ELIGIBILITY RESULTS ─────────────────────────────
class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id          = Column(String(36), primary_key=True, default=generate_uuid)
    student_id  = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    company_id  = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    status      = Column(Enum("eligible", "near_eligible", "not_eligible"), nullable=False)
    skill_gap   = Column(JSON, default=dict)
    analyzed_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("Student", back_populates="eligibility_results")
    company = relationship("Company", back_populates="eligibility_results")


# ── TABLE 8: RECOMMENDATIONS ─────────────────────────────────
class Recommendation(Base):
    __tablename__ = "recommendations"

    id           = Column(String(36), primary_key=True, default=generate_uuid)
    student_id   = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    company_id   = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    roadmap      = Column(Text, nullable=True)
    generated_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("Student", back_populates="recommendations")
    company = relationship("Company", back_populates="recommendations")


# ── TABLE 9: PROGRESS TRACKING ───────────────────────────────
class ProgressTracking(Base):
    __tablename__ = "progress_tracking"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    student_id      = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    readiness_score = Column(Float, nullable=False)

    # ── NEW ──────────────────────────────────────────────────
    # Optional snapshot of what drove the score at this point in time.
    # Shape: {
    #   "skills_count": 8,
    #   "cgpa": 7.8,
    #   "leetcode_count": 120,
    #   "projects_count": 2,
    #   "internships_count": 1,
    #   "eligible_companies": ["TCS", "Infosys"],
    #   "trigger": "profile_update" | "skill_marked"
    # }
    score_snapshot  = Column(JSON, nullable=True, default=None)
    # ─────────────────────────────────────────────────────────

    recorded_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("Student", back_populates="progress_tracking")


# ── TABLE 10: CHAT HISTORY ───────────────────────────────────
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id         = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    message    = Column(Text, nullable=False)
    response   = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("Student", back_populates="chat_history")

    # ── TABLE 11: SKILL NEWS (faculty notice board) ──────────────
class SkillNews(Base):
    __tablename__ = "skill_news"
 
    id         = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
 
    # Content
    title      = Column(String(255), nullable=False)
    body       = Column(Text, nullable=False)
 
    # Type: "tip" | "trend" | "company_update" | "alert"
    post_type  = Column(
        Enum("tip", "trend", "company_update", "alert"),
        nullable=False,
        default="tip"
    )
 
    # Priority: "low" | "medium" | "high" | "urgent"
    priority   = Column(
        Enum("low", "medium", "high", "urgent"),
        nullable=False,
        default="medium"
    )
 
    # Optional: skill tag (e.g. "React", "AWS") and resource URL
    skill_tag  = Column(String(100), nullable=True)
    resource_url = Column(Text, nullable=True)
 
    # Pinned posts always appear at the top
    is_pinned  = Column(Boolean, default=False)
 
    # Soft delete — faculty can hide without permanent delete
    is_active  = Column(Boolean, default=True)
 
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
 
    faculty    = relationship("User", foreign_keys=[faculty_id])