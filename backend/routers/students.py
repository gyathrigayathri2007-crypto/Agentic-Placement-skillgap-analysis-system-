from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import User, Student, Skill, Project, Internship, EligibilityResult, ProgressTracking
from schemas import StudentProfileCreate, StudentProfileUpdate
from auth import get_current_student

router = APIRouter()

@router.post("/profile")
def create_profile(
    profile_data: StudentProfileCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    student = db.query(Student).filter(Student.id == current_user.id).first()

    student.name = profile_data.name
    student.department = profile_data.department
    student.year = profile_data.year
    student.section = profile_data.section
    student.cgpa = profile_data.cgpa
    student.leetcode_count = profile_data.leetcode_count
    student.hackerrank_score = profile_data.hackerrank_score
    student.codechef_rating = profile_data.codechef_rating
    student.codeforces_rating = profile_data.codeforces_rating
    student.resume_url = profile_data.resume_url
    student.certification_urls = profile_data.certification_urls
    student.profile_completed = True

    db.query(Skill).filter(Skill.student_id == current_user.id).delete()
    db.query(Project).filter(Project.student_id == current_user.id).delete()
    db.query(Internship).filter(Internship.student_id == current_user.id).delete()

    for skill_name in profile_data.skills:
        db.add(Skill(student_id=current_user.id, skill_name=skill_name))

    for proj in profile_data.projects:
        db.add(Project(student_id=current_user.id, title=proj.title, description=proj.description))

    for intern in profile_data.internships:
        db.add(Internship(student_id=current_user.id, company=intern.company, role=intern.role))

    db.commit()

    from agents.pipeline import run_agentic_pipeline
    background_tasks.add_task(run_agentic_pipeline, current_user.id)

    return {"message": "Profile created successfully. AI analysis started."}

@router.put("/profile")
def update_profile(
    profile_data: StudentProfileUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    student = db.query(Student).filter(Student.id == current_user.id).first()

    student.name = profile_data.name
    student.department = profile_data.department
    student.year = profile_data.year
    student.section = profile_data.section
    student.cgpa = profile_data.cgpa
    student.leetcode_count = profile_data.leetcode_count
    student.hackerrank_score = profile_data.hackerrank_score
    student.codechef_rating = profile_data.codechef_rating
    student.codeforces_rating = profile_data.codeforces_rating
    student.resume_url = profile_data.resume_url
    student.certification_urls = profile_data.certification_urls

    db.query(Skill).filter(Skill.student_id == current_user.id).delete()
    db.query(Project).filter(Project.student_id == current_user.id).delete()
    db.query(Internship).filter(Internship.student_id == current_user.id).delete()

    for skill_name in profile_data.skills:
        db.add(Skill(student_id=current_user.id, skill_name=skill_name))

    for proj in profile_data.projects:
        db.add(Project(student_id=current_user.id, title=proj.title, description=proj.description))

    for intern in profile_data.internships:
        db.add(Internship(student_id=current_user.id, company=intern.company, role=intern.role))

    db.commit()

    from agents.pipeline import run_agentic_pipeline
    background_tasks.add_task(run_agentic_pipeline, current_user.id)

    return {"message": "Profile updated. AI re-analysis started."}

@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    student = db.query(Student).filter(Student.id == current_user.id).first()
    return student

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    student = db.query(Student).filter(Student.id == current_user.id).first()
    eligibility = db.query(EligibilityResult).filter(
        EligibilityResult.student_id == current_user.id
    ).all()
    progress = db.query(ProgressTracking).filter(
        ProgressTracking.student_id == current_user.id
    ).order_by(ProgressTracking.recorded_at).all()

    companies = []
    for e in eligibility:
        companies.append({
            "company_id": e.company_id,
            "company_name": e.company.name,
            "package": e.company.package,
            "status": e.status,
            "skill_gap": e.skill_gap
        })

    progress_list = []
    for p in progress:
        progress_list.append({
            "readiness_score": p.readiness_score,
            "recorded_at": str(p.recorded_at)
        })

    return {
        "student": student,
        "readiness_score": student.readiness_score,
        "companies": companies,
        "progress": progress_list
    }