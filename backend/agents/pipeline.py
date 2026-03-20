from sqlalchemy.orm import Session
from database import SessionLocal
from models import Student, Company, EligibilityResult, ProgressTracking
from models import Recommendation
from agents.eligibility import determine_eligibility
from agents.skill_gap import calculate_skill_gap
from agents.gemini import get_recommendation

# ── READINESS SCORE FORMULA ───────────────────────────────────
def calculate_readiness_score(student) -> float:
    score = 0

    # CGPA contributes 30%
    if student.cgpa:
        score += (student.cgpa / 10) * 30

    # LeetCode contributes 25%
    if student.leetcode_count:
        score += min(student.leetcode_count / 200, 1) * 25

    # Skills contributes 20%
    skills_count = len(student.skills) if student.skills else 0
    score += min(skills_count / 10, 1) * 20

    # Projects contributes 15%
    projects_count = len(student.projects) if student.projects else 0
    score += min(projects_count / 3, 1) * 15

    # Internships contributes 10%
    internships_count = len(student.internships) if student.internships else 0
    score += min(internships_count / 2, 1) * 10

    return round(score, 2)

# ── MAIN PIPELINE ─────────────────────────────────────────────
def run_agentic_pipeline(student_id: str):
    db: Session = SessionLocal()

    try:
        print(f"[AGENT] Starting pipeline for student: {student_id}")

        # AGENT 1: Get student with all related data
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            print(f"[AGENT] Student not found: {student_id}")
            return

        print(f"[AGENT 1] Student profiling complete: {student.name}")

        # AGENT 2 + 3: Eligibility matching + Skill gap for each company
        companies = db.query(Company).all()
        print(f"[AGENT 2] Comparing against {len(companies)} companies")

        for company in companies:
            # Determine eligibility status
            status = determine_eligibility(student, company)

            # Calculate skill gap
            student_skills = [s.skill_name for s in student.skills]
            required_skills = company.required_skills or []
            gap = calculate_skill_gap(student_skills, required_skills)

            # Save or update eligibility result
            existing = db.query(EligibilityResult).filter(
                EligibilityResult.student_id == student_id,
                EligibilityResult.company_id == company.id
            ).first()

            if existing:
                existing.status = status
                existing.skill_gap = gap
            else:
                new_result = EligibilityResult(
                    student_id=student_id,
                    company_id=company.id,
                    status=status,
                    skill_gap=gap
                )
                db.add(new_result)

            db.commit()
            print(f"[AGENT 2] {company.name}: {status}")

            # AGENT 4: Generate AI recommendation for eligible/near_eligible
            if status in ["eligible", "near_eligible"]:
                gap_skills = [
                    skill for skill, data in gap.items()
                    if not data.get("has_skill", False)
                ]

                roadmap = get_recommendation(
                    student_skills=student_skills,
                    company_name=company.name,
                    required_skills=required_skills,
                    gap_skills=gap_skills
                )
                existing_rec = db.query(Recommendation).filter(
                Recommendation.student_id == student_id,
                     Recommendation.company_id == company.id
                    ).first()

                if existing_rec:
                    existing_rec.roadmap = roadmap
                else:
                    from models import Recommendation
                    new_rec = Recommendation(
                        student_id=student_id,
                        company_id=company.id,
                        roadmap=roadmap
                    )
                    db.add(new_rec)

                db.commit()
                print(f"[AGENT 4] Recommendation generated for {company.name}")

        # AGENT 5: Calculate and save readiness score
        readiness_score = calculate_readiness_score(student)
        student.readiness_score = readiness_score

        progress = ProgressTracking(
            student_id=student_id,
            readiness_score=readiness_score
        )
        db.add(progress)
        db.commit()

        print(f"[AGENT 5] Readiness score: {readiness_score}%")
        print(f"[AGENT] Pipeline complete for {student.name}")

    except Exception as e:
        print(f"[AGENT ERROR] {str(e)}")
        db.rollback()

    finally:
        db.close()