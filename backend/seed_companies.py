# backend/seed_companies.py
# Run this ONCE to insert 10 companies into the database
# Usage: python seed_companies.py

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Company, User
import uuid

def generate_uuid():
    return str(uuid.uuid4())

COMPANIES = [
    {
        "name": "TCS (Tata Consultancy Services)",
        "required_skills": ["Python", "Java", "SQL", "Communication", "Problem Solving"],
        "cgpa_cutoff": 6.0,
        "aptitude_requirement": "TCS NQT — Numerical, Verbal, Reasoning",
        "certifications_required": "None mandatory",
        "package": "3.5 LPA"
    },
    {
        "name": "Infosys",
        "required_skills": ["Java", "Python", "SQL", "Data Structures", "Communication"],
        "cgpa_cutoff": 6.5,
        "aptitude_requirement": "Infosys Aptitude + Verbal + Logical Reasoning",
        "certifications_required": "None mandatory",
        "package": "3.6 LPA"
    },
    {
        "name": "Wipro",
        "required_skills": ["C", "C++", "Java", "SQL", "OOP Concepts"],
        "cgpa_cutoff": 6.0,
        "aptitude_requirement": "AMCAT test — Quantitative + Logical",
        "certifications_required": "None mandatory",
        "package": "3.5 LPA"
    },
    {
        "name": "Cognizant (CTS)",
        "required_skills": ["Java", "Python", "HTML", "CSS", "SQL", "Communication"],
        "cgpa_cutoff": 6.5,
        "aptitude_requirement": "GenC / GenC Elevate aptitude test",
        "certifications_required": "None mandatory",
        "package": "4.0 LPA"
    },
    {
        "name": "Accenture",
        "required_skills": ["Python", "Java", "SQL", "Problem Solving", "Communication"],
        "cgpa_cutoff": 6.5,
        "aptitude_requirement": "Cognitive + Technical + Coding assessment",
        "certifications_required": "None mandatory",
        "package": "4.5 LPA"
    },
    {
        "name": "HCL Technologies",
        "required_skills": ["Java", "C++", "SQL", "Networking", "OOP"],
        "cgpa_cutoff": 6.0,
        "aptitude_requirement": "HCL Aptitude — Quant + Verbal + Technical",
        "certifications_required": "None mandatory",
        "package": "3.8 LPA"
    },
    {
        "name": "Zoho Corporation",
        "required_skills": ["C", "C++", "Java", "Data Structures", "Algorithms", "Problem Solving"],
        "cgpa_cutoff": 7.0,
        "aptitude_requirement": "Zoho coding test — Strong DSA required",
        "certifications_required": "None mandatory",
        "package": "5.0 LPA"
    },
    {
        "name": "Amazon (Operations)",
        "required_skills": ["Python", "SQL", "Data Structures", "Algorithms", "System Design"],
        "cgpa_cutoff": 7.5,
        "aptitude_requirement": "Online Assessment + Technical Interview",
        "certifications_required": "AWS Cloud Practitioner preferred",
        "package": "7.0 LPA"
    },
    {
        "name": "Capgemini",
        "required_skills": ["Java", "Python", "SQL", "Agile", "Communication"],
        "cgpa_cutoff": 6.0,
        "aptitude_requirement": "Capgemini Game-based + Technical + Behavioral",
        "certifications_required": "None mandatory",
        "package": "4.0 LPA"
    },
    {
        "name": "Tech Mahindra",
        "required_skills": ["Java", "SQL", "Networking", "Communication", "Problem Solving"],
        "cgpa_cutoff": 6.0,
        "aptitude_requirement": "Aptitude + Technical MCQ + HR",
        "certifications_required": "None mandatory",
        "package": "3.7 LPA"
    },
]

def seed():
    db = SessionLocal()
    try:
        # Get any faculty user to use as created_by
        faculty = db.query(User).filter(User.role == "faculty").first()
        if not faculty:
            print("❌ No faculty user found. Please register a faculty account first, then run this script.")
            return

        inserted = 0
        skipped  = 0
        for c in COMPANIES:
            exists = db.query(Company).filter(Company.name == c["name"]).first()
            if exists:
                print(f"⏭  Skipping (already exists): {c['name']}")
                skipped += 1
                continue

            company = Company(
                id=generate_uuid(),
                name=c["name"],
                required_skills=c["required_skills"],
                cgpa_cutoff=c["cgpa_cutoff"],
                aptitude_requirement=c["aptitude_requirement"],
                certifications_required=c["certifications_required"],
                package=c["package"],
                created_by=faculty.id
            )
            db.add(company)
            inserted += 1
            print(f"✅ Inserted: {c['name']} — {c['package']}")

        db.commit()
        print(f"\n🎉 Done! {inserted} companies inserted, {skipped} skipped.")
        print("Now students can submit profiles and AI will analyze against these companies.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()