from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Company
from schemas import CompanyCreate, CompanyUpdate
from auth import get_current_user, get_current_faculty

router = APIRouter()

@router.get("/")
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    companies = db.query(Company).all()
    result = []
    for c in companies:
        result.append({
            "id": c.id,
            "name": c.name,
            "required_skills": c.required_skills,
            "cgpa_cutoff": c.cgpa_cutoff,
            "aptitude_requirement": c.aptitude_requirement,
            "certifications_required": c.certifications_required,
            "package": c.package
        })
    return result

@router.get("/{company_id}")
def get_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": company.id,
        "name": company.name,
        "required_skills": company.required_skills,
        "cgpa_cutoff": company.cgpa_cutoff,
        "aptitude_requirement": company.aptitude_requirement,
        "certifications_required": company.certifications_required,
        "package": company.package
    }

@router.post("/")
def add_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    new_company = Company(
        name=company_data.name,
        required_skills=company_data.required_skills,
        cgpa_cutoff=company_data.cgpa_cutoff,
        aptitude_requirement=company_data.aptitude_requirement,
        certifications_required=company_data.certifications_required,
        package=company_data.package,
        created_by=current_user.id
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return {
        "message": "Company added successfully",
        "company_id": new_company.id
    }

@router.put("/{company_id}")
def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.name = company_data.name
    company.required_skills = company_data.required_skills
    company.cgpa_cutoff = company_data.cgpa_cutoff
    company.aptitude_requirement = company_data.aptitude_requirement
    company.certifications_required = company_data.certifications_required
    company.package = company_data.package
    db.commit()
    return {"message": "Company updated successfully"}

@router.delete("/{company_id}")
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()
    return {"message": "Company deleted successfully"}