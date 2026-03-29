# backend/routers/faculty.py
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io

from database import get_db
from models import User, Student, Company, EligibilityResult, Recommendation, ProgressTracking
from auth import get_current_faculty
from utils.export import generate_excel_report

router = APIRouter()


# ── STATS ─────────────────────────────────────────────────────
@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    students = db.query(Student).filter(Student.profile_completed == True).all()

    total_students  = len(students)
    total_companies = db.query(Company).count()
    above_75        = sum(1 for s in students if (s.readiness_score or 0) >= 75)
    above_50        = sum(1 for s in students if (s.readiness_score or 0) >= 50)
    avg_score       = sum(s.readiness_score or 0 for s in students) / total_students if students else 0

    # Readiness distribution for chart
    distribution = {
        "0-25":   sum(1 for s in students if (s.readiness_score or 0) < 25),
        "25-50":  sum(1 for s in students if 25 <= (s.readiness_score or 0) < 50),
        "50-75":  sum(1 for s in students if 50 <= (s.readiness_score or 0) < 75),
        "75-100": sum(1 for s in students if (s.readiness_score or 0) >= 75),
    }

    return {
        "total_students":      total_students,
        "total_companies":     total_companies,
        "above_75_count":      above_75,
        "above_50_count":      above_50,
        "avg_readiness_score": round(avg_score, 2),
        "distribution":        distribution,
    }


# ── STUDENT LIST (paginated, filtered) ───────────────────────
@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
    year:       Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    section:    Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
    min_score:  Optional[float] = Query(None),
    status:     Optional[str] = Query(None),  # "eligible" | "near_eligible" | "not_eligible"
):
    query = db.query(Student).filter(Student.profile_completed == True)

    if year:       query = query.filter(Student.year == year)
    if department: query = query.filter(Student.department == department)
    if section:    query = query.filter(Student.section == section)
    if search:     query = query.filter(Student.name.ilike(f"%{search}%"))
    if min_score is not None:
        query = query.filter(Student.readiness_score >= min_score)

    students = query.order_by(Student.readiness_score.desc()).all()

    result = []
    for s in students:
        eligible_count     = 0
        near_eligible_count = 0
        not_eligible_count  = 0

        for er in s.eligibility_results:
            if er.status == "eligible":
                eligible_count += 1
            elif er.status == "near_eligible":
                near_eligible_count += 1
            else:
                not_eligible_count += 1

        # Filter by eligibility status if requested
        if status:
            if status == "eligible"     and eligible_count == 0:      continue
            if status == "near_eligible" and near_eligible_count == 0: continue
            if status == "not_eligible"  and not_eligible_count == 0:  continue

        # Count verified skills
        verified_skills = sum(
            1 for sk in s.skills
            if sk.skill_metadata and sk.skill_metadata.get("verified")
        )

        result.append({
            "id":                       s.id,
            "name":                     s.name,
            "department":               s.department,
            "year":                     s.year,
            "section":                  s.section,
            "cgpa":                     s.cgpa,
            "readiness_score":          s.readiness_score or 0,
            "skills_count":             len(s.skills),
            "verified_skills_count":    verified_skills,
            "projects_count":           len(s.projects),
            "internships_count":        len(s.internships),
            "eligible_companies_count": eligible_count,
            "near_eligible_count":      near_eligible_count,
            "not_eligible_count":       not_eligible_count,
        })

    return result


# ── STUDENT FULL DETAIL ───────────────────────────────────────
@router.get("/students/{student_id}")
def get_student_detail(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    """
    Full student detail for faculty modal.
    Returns: profile, skills (with proof), projects, internships,
             company eligibility with skill gap breakdown,
             AI recommendations, and progress history.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # ── Skills with proof metadata ────────────────────────────
    skills_data = []
    for s in student.skills:
        meta = s.skill_metadata or {}
        skills_data.append({
            "skill_name":      s.skill_name,
            "source":          meta.get("source", "profile_import"),
            "learned_at":      meta.get("learned_at"),
            "certificate_url": meta.get("certificate_url"),
            "verified":        meta.get("verified", False),
        })
    skills_data.sort(key=lambda x: (not x["verified"], x["skill_name"].lower()))

    # ── Company eligibility with full skill gap ───────────────
    eligibility_results = db.query(EligibilityResult).filter(
        EligibilityResult.student_id == student_id
    ).all()

    companies_data = []
    for e in eligibility_results:
        raw_gap = e.skill_gap or {}

        # Parse skill gap into structured breakdown
        missing_skills  = []
        present_skills  = []
        critical_gaps   = []

        for skill_name, gap_info in raw_gap.items():
            entry = {
                "skill":            skill_name,
                "has_skill":        gap_info.get("has_skill", False),
                "student_level":    gap_info.get("student_level", 0),
                "required_level":   gap_info.get("required_level", 75),
                "gap_severity":     gap_info.get("gap_severity", "high"),
                "action":           gap_info.get("action", ""),
                "proficiency_target": gap_info.get("proficiency_target", "Intermediate"),
            }
            if gap_info.get("has_skill"):
                present_skills.append(entry)
            else:
                missing_skills.append(entry)
                if gap_info.get("gap_severity") == "critical":
                    critical_gaps.append(skill_name)

        # Sort missing by severity (critical first)
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        missing_skills.sort(key=lambda x: severity_order.get(x["gap_severity"], 2))

        companies_data.append({
            "company_id":      e.company_id,
            "company_name":    e.company.name    if e.company else "Unknown",
            "package":         e.company.package if e.company else None,
            "cgpa_cutoff":     e.company.cgpa_cutoff if e.company else None,
            "required_skills": e.company.required_skills if e.company else [],
            "status":          e.status,
            "missing_skills":  missing_skills,
            "present_skills":  present_skills,
            "critical_gaps":   critical_gaps,
            "skill_gap_raw":   raw_gap,
            "analyzed_at":     str(e.analyzed_at),
        })

    # Sort companies: eligible → near_eligible → not_eligible
    status_order = {"eligible": 0, "near_eligible": 1, "not_eligible": 2}
    companies_data.sort(key=lambda x: status_order.get(x["status"], 2))

    # ── AI Recommendations ────────────────────────────────────
    recommendations = db.query(Recommendation).filter(
        Recommendation.student_id == student_id
    ).all()

    recommendations_data = [
        {
            "company_name": r.company.name if r.company else "Unknown",
            "roadmap":      r.roadmap,
            "generated_at": str(r.generated_at),
        }
        for r in recommendations
    ]

    # ── Progress history ──────────────────────────────────────
    progress_history = db.query(ProgressTracking).filter(
        ProgressTracking.student_id == student_id
    ).order_by(ProgressTracking.recorded_at).all()

    progress_data = [
        {
            "readiness_score": p.readiness_score,
            "recorded_at":     str(p.recorded_at),
            "snapshot":        p.score_snapshot or {},
        }
        for p in progress_history
    ]

    # ── Summary stats ─────────────────────────────────────────
    eligible_count      = sum(1 for c in companies_data if c["status"] == "eligible")
    near_eligible_count = sum(1 for c in companies_data if c["status"] == "near_eligible")
    verified_count      = sum(1 for sk in skills_data if sk["verified"])

    # Aggregate missing skills across all companies with frequency
    all_missing = {}
    for c in companies_data:
        for ms in c["missing_skills"]:
            name = ms["skill"]
            if name not in all_missing:
                all_missing[name] = {"skill": name, "companies": [], "severity": ms["gap_severity"]}
            all_missing[name]["companies"].append(c["company_name"])

    priority_gaps = sorted(
        all_missing.values(),
        key=lambda x: (-len(x["companies"]), x["severity"])
    )

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
            "codechef_rating":   student.codechef_rating,
            "codeforces_rating": student.codeforces_rating,
            "readiness_score":   student.readiness_score   or 0,
            "resume_url":        student.resume_url,
            "profile_picture":   student.profile_picture,           "profile_completed": student.profile_completed,
            "skills":            skills_data,
            "projects":          [{"title": p.title, "description": p.description} for p in student.projects],
            "internships":       [{"company": i.company, "role": i.role} for i in student.internships],
        },
        "summary": {
            "eligible_companies":      eligible_count,
            "near_eligible_companies": near_eligible_count,
            "verified_skills":         verified_count,
            "total_skills":            len(skills_data),
            "total_companies_analyzed": len(companies_data),
        },
        "companies":        companies_data,
        "priority_gaps":    priority_gaps,    # top missing skills across all companies
        "recommendations":  recommendations_data,
        "progress_history": progress_data,
    }


# ── EXPORT EXCEL (filter-aware) ───────────────────────────────
@router.get("/export")
def export_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
    year:       Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    section:    Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
):
    """
    Download Excel report for the currently filtered set of students.
    Pass the same query params used in the student list to get a matching export.
    e.g. /api/faculty/export?year=2nd Year&department=CSE
    """
    query = db.query(Student).filter(Student.profile_completed == True)

    if year:       query = query.filter(Student.year == year)
    if department: query = query.filter(Student.department == department)
    if section:    query = query.filter(Student.section == section)
    if search:     query = query.filter(Student.name.ilike(f"%{search}%"))

    students = query.order_by(Student.readiness_score.desc()).all()

    # Build a meaningful filename based on active filters
    parts = ["students"]
    if year:       parts.append(year.replace(" ", "_"))
    if department: parts.append(department)
    if section:    parts.append(f"Sec{section}")
    filename = "_".join(parts) + "_report.xlsx"

    excel_file = generate_excel_report(students)

    return StreamingResponse(
        io.BytesIO(excel_file),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )