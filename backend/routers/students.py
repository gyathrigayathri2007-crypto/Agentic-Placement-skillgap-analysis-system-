# backend/routers/students.py
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import (
    User, Student, Skill, Project, Internship,
    EligibilityResult, ProgressTracking, Recommendation
)
from schemas import StudentProfileCreate, StudentProfileUpdate
from auth import get_current_student
from agents.pipeline import run_agentic_pipeline

router = APIRouter()


# ── HELPER ────────────────────────────────────────────────────
def _save_profile(db: Session, student_id: str, profile_data):
    """
    Upsert all profile fields, skills, projects, internships.

    IMPORTANT: In this schema Student.id == User.id (same UUID).
    So student_id here is always current_user.id — no separate lookup needed.
    """
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        student = Student(id=student_id)
        db.add(student)
        db.flush()

    student.name               = profile_data.name
    student.department         = profile_data.department
    student.year               = profile_data.year
    student.section            = profile_data.section or ""
    student.cgpa               = profile_data.cgpa
    student.leetcode_count     = profile_data.leetcode_count    or 0
    student.hackerrank_score   = profile_data.hackerrank_score  or 0
    student.codechef_rating    = profile_data.codechef_rating
    student.codeforces_rating  = profile_data.codeforces_rating
    student.resume_url         = profile_data.resume_url
    student.certification_urls = (
        [profile_data.certification_urls] if profile_data.certification_urls else []
    )
    student.profile_completed  = True

    # ── Preserve skill_metadata for skills that already exist ──
    # When re-saving profile, don't wipe out certificate proof
    # a student already submitted for a skill.
    existing_skill_meta = {
        s.skill_name.lower(): s.skill_metadata
        for s in student.skills
        if s.skill_metadata is not None
    }

    db.query(Skill).filter(Skill.student_id == student_id).delete()
    db.query(Project).filter(Project.student_id == student_id).delete()
    db.query(Internship).filter(Internship.student_id == student_id).delete()

    # Skills — restore metadata if it existed before
    for skill_name in (profile_data.skills or []):
        name = str(skill_name).strip()
        if name:
            saved_meta = existing_skill_meta.get(name.lower())
            db.add(Skill(
                student_id=student_id,
                skill_name=name,
                skill_metadata=saved_meta or {
                    "source": "profile_import",
                    "learned_at": datetime.utcnow().isoformat(),
                    "certificate_url": None,
                    "verified": False
                }
            ))

    # Projects
    for proj in (profile_data.projects or []):
        if proj.title and proj.title.strip():
            db.add(Project(
                student_id=student_id,
                title=proj.title.strip(),
                description=(proj.description or "").strip()
            ))

    # Internships
    for intern in (profile_data.internships or []):
        if intern.company and intern.company.strip():
            db.add(Internship(
                student_id=student_id,
                company=intern.company.strip(),
                role=(intern.role or "").strip()
            ))

    db.commit()
    db.refresh(student)
    return student


# ── CREATE PROFILE ────────────────────────────────────────────
@router.post("/profile")
def create_profile(
    profile_data: StudentProfileCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    _save_profile(db, current_user.id, profile_data)
    background_tasks.add_task(run_agentic_pipeline, current_user.id, "profile_create")
    return {"message": "Profile created. AI analysis started."}


# ── UPDATE PROFILE ────────────────────────────────────────────
@router.put("/profile")
def update_profile(
    profile_data: StudentProfileUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    _save_profile(db, current_user.id, profile_data)
    background_tasks.add_task(run_agentic_pipeline, current_user.id, "profile_update")
    return {"message": "Profile updated. AI re-analysis started."}


# ── GET PROFILE ───────────────────────────────────────────────
@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    student = db.query(Student).filter(Student.id == current_user.id).first()

    if not student or not student.profile_completed:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "id":                student.id,
        "name":              student.name,
        "department":        student.department,
        "year":              student.year,
        "section":           student.section,
        "cgpa":              student.cgpa,
        "leetcode_count":    student.leetcode_count    or 0,
        "hackerrank_score":  student.hackerrank_score  or 0,
        "codechef_rating":   student.codechef_rating,
        "codeforces_rating": student.codeforces_rating,
        "resume_url":        student.resume_url,
        "profile_completed": student.profile_completed,
        "readiness_score":   student.readiness_score   or 0,
        "skills": [
            {
                "skill_name":       s.skill_name,
                "certificate_url":  (s.skill_metadata or {}).get("certificate_url"),
                "learned_at":       (s.skill_metadata or {}).get("learned_at"),
                "source":           (s.skill_metadata or {}).get("source", "profile_import"),
                "verified":         (s.skill_metadata or {}).get("verified", False),
            }
            for s in student.skills
        ],
        "projects":    [{"id": p.id, "title": p.title, "description": p.description} for p in student.projects],
        "internships": [{"id": i.id, "company": i.company, "role": i.role} for i in student.internships],
    }


# ── DASHBOARD ─────────────────────────────────────────────────
@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    student = db.query(Student).filter(Student.id == current_user.id).first()

    if not student or not student.profile_completed:
        raise HTTPException(status_code=404, detail="Profile not completed")

    eligibility = db.query(EligibilityResult).filter(
        EligibilityResult.student_id == current_user.id
    ).all()

    progress = db.query(ProgressTracking).filter(
        ProgressTracking.student_id == current_user.id
    ).order_by(ProgressTracking.recorded_at).all()

    companies = []
    for e in eligibility:
        companies.append({
            "company_id":   e.company_id,
            "company_name": e.company.name    if e.company else "Unknown",
            "package":      e.company.package if e.company else None,
            "status":       e.status,
            "skill_gap":    e.skill_gap or {},
        })

    progress_list = [
        {
            "readiness_score": p.readiness_score,
            "recorded_at":     str(p.recorded_at),
            "snapshot":        p.score_snapshot or {},
        }
        for p in progress
    ]

    return {
        "student": {
            "id":                student.id,
            "name":              student.name,
            "department":        student.department,
            "year":              student.year,
            "section":           student.section,
            "cgpa":              student.cgpa,
            "leetcode_count":    student.leetcode_count    or 0,
            "hackerrank_score":  student.hackerrank_score  or 0,
            "readiness_score":   student.readiness_score   or 0,
            "profile_completed": student.profile_completed,
            "skills":      [{"skill_name": s.skill_name} for s in student.skills],
            "projects":    [{"title": p.title} for p in student.projects],
            "internships": [{"company": i.company, "role": i.role} for i in student.internships],
        },
        "readiness_score": student.readiness_score or 0,
        "companies":       companies,
        "progress":        progress_list,
    }


# ── MARK SKILL LEARNED (with certificate proof) ───────────────
@router.patch("/skills/learned")
def mark_skill_learned(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Mark a skill as learned and optionally attach a certificate URL.

    Payload:
        skill_name      (str, required)
        certificate_url (str, optional) — Coursera / NPTEL / HackerRank cert link

    Behaviour:
    - If skill already exists → update its metadata with the new certificate URL.
    - If skill is new → add it to the profile, store proof metadata.
    - Either way → re-trigger the agentic pipeline so dashboard updates.
    """
    skill_name      = (payload.get("skill_name") or "").strip()
    certificate_url = (payload.get("certificate_url") or "").strip() or None

    if not skill_name:
        raise HTTPException(status_code=400, detail="skill_name is required")

    # Student.id == User.id in this schema
    student = db.query(Student).filter(Student.id == current_user.id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Profile not found. Complete your profile first.")

    # Build metadata to store
    metadata = {
        "source":          "self_marked",
        "learned_at":      datetime.utcnow().isoformat(),
        "certificate_url": certificate_url,
        "verified":        bool(certificate_url),   # auto-verify if URL provided
    }

    existing = db.query(Skill).filter(
        Skill.student_id == student.id,
        Skill.skill_name.ilike(skill_name)
    ).first()

    is_new_skill = False

    if existing:
        # Skill already in profile — just update the proof metadata
        # Preserve old certificate_url if a new one wasn't provided
        old_meta = existing.skill_metadata or {}
        if certificate_url is None and old_meta.get("certificate_url"):
            metadata["certificate_url"] = old_meta["certificate_url"]
            metadata["verified"] = True
        existing.skill_metadata = metadata
        db.commit()
        message = f"Certificate proof saved for '{skill_name}'"
    else:
        # New skill — add to profile
        new_skill = Skill(
            student_id=student.id,
            skill_name=skill_name,
            skill_metadata=metadata
        )
        db.add(new_skill)
        db.commit()
        is_new_skill = True
        message = f"'{skill_name}' added to your profile"

    # Always re-trigger pipeline — new skill changes eligibility and gaps
    background_tasks.add_task(run_agentic_pipeline, student.id, "skill_marked")

    return {
        "message":         message,
        "skill_name":      skill_name,
        "is_new_skill":    is_new_skill,
        "certificate_url": certificate_url,
        "verified":        bool(certificate_url),
    }


# ── GET SKILL PROOF (for profile page display) ────────────────
@router.get("/skills/proof")
def get_skill_proofs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Return all skills with their proof/certificate data.
    Used by ProfilePage and SkillsPage to show verification status.
    """
    student = db.query(Student).filter(Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Profile not found")

    skills_with_proof = []
    for s in student.skills:
        meta = s.skill_metadata or {}
        skills_with_proof.append({
            "skill_name":      s.skill_name,
            "source":          meta.get("source", "profile_import"),
            "learned_at":      meta.get("learned_at"),
            "certificate_url": meta.get("certificate_url"),
            "verified":        meta.get("verified", False),
        })

    # Sort: verified first, then by name
    skills_with_proof.sort(key=lambda x: (not x["verified"], x["skill_name"].lower()))

    return {"skills": skills_with_proof}
