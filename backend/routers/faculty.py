from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
from database import get_db
from models import User, Student, Company, EligibilityResult
from auth import get_current_faculty
from utils.export import generate_excel_report

router = APIRouter()

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    total_students = db.query(Student).count()
    total_companies = db.query(Company).count()
    above_75 = db.query(Student).filter(Student.readiness_score >= 75).count()
    students = db.query(Student).all()
    avg_score = sum(s.readiness_score for s in students) / len(students) if students else 0

    return {
        "total_students": total_students,
        "total_companies": total_companies,
        "above_75_count": above_75,
        "avg_readiness_score": round(avg_score, 2)
    }

@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
    year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = db.query(Student).filter(Student.profile_completed == True)

    if year:
        query = query.filter(Student.year == year)
    if department:
        query = query.filter(Student.department == department)
    if section:
        query = query.filter(Student.section == section)
    if search:
        query = query.filter(Student.name.ilike(f"%{search}%"))

    students = query.all()

    result = []
    for s in students:
        eligible_count = db.query(EligibilityResult).filter(
            EligibilityResult.student_id == s.id,
            EligibilityResult.status == "eligible"
        ).count()

        result.append({
            "id": s.id,
            "name": s.name,
            "department": s.department,
            "year": s.year,
            "section": s.section,
            "cgpa": s.cgpa,
            "readiness_score": s.readiness_score,
            "skills_count": len(s.skills),
            "eligible_companies_count": eligible_count
        })

    return result

@router.get("/students/{student_id}")
def get_student_detail(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": "Student not found"}

    eligibility = db.query(EligibilityResult).filter(
        EligibilityResult.student_id == student_id
    ).all()

    companies = [{
        "company_name": e.company.name,
        "status": e.status,
        "package": e.company.package
    } for e in eligibility]

    return {
        "student": student,
        "companies": companies
    }

@router.get("/export")
def export_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    students = db.query(Student).filter(Student.profile_completed == True).all()
    excel_file = generate_excel_report(students)

    return StreamingResponse(
        io.BytesIO(excel_file),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_report.xlsx"}
    )