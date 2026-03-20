from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Student, ChatHistory, Recommendation, EligibilityResult, Company
from schemas import ChatRequest
from auth import get_current_student
from agents.gemini import get_chat_response, get_recommendation

router = APIRouter()

@router.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    history = db.query(ChatHistory).filter(
        ChatHistory.student_id == current_user.id
    ).order_by(ChatHistory.created_at.desc()).limit(10).all()

    history_list = [{"message": h.message, "response": h.response} for h in reversed(history)]
    response_text = get_chat_response(request.message, history_list)

    chat_entry = ChatHistory(
        student_id=current_user.id,
        message=request.message,
        response=response_text
    )
    db.add(chat_entry)
    db.commit()

    return {"response": response_text}

@router.get("/recommendations/{company_id}")
def get_company_recommendation(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    existing = db.query(Recommendation).filter(
        Recommendation.student_id == current_user.id,
        Recommendation.company_id == company_id
    ).first()

    if existing:
        return {"company_id": company_id, "roadmap": existing.roadmap}

    student = db.query(Student).filter(Student.id == current_user.id).first()
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    eligibility = db.query(EligibilityResult).filter(
        EligibilityResult.student_id == current_user.id,
        EligibilityResult.company_id == company_id
    ).first()

    student_skills = [s.skill_name for s in student.skills]
    required_skills = company.required_skills or []
    gap_skills = [s for s in required_skills if s not in student_skills]

    roadmap = get_recommendation(
        student_skills=student_skills,
        company_name=company.name,
        required_skills=required_skills,
        gap_skills=gap_skills
    )

    new_rec = Recommendation(
        student_id=current_user.id,
        company_id=company_id,
        roadmap=roadmap
    )
    db.add(new_rec)
    db.commit()

    return {"company_id": company_id, "roadmap": roadmap}