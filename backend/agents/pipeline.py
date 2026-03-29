# backend/agents/pipeline.py
from sqlalchemy.orm import Session
from datetime import datetime

from database import SessionLocal
from models import Student, Company, EligibilityResult, ProgressTracking, Recommendation
from agents.eligibility import determine_eligibility
from agents.skill_gap import calculate_skill_gap
from agents.gemini import get_recommendation


# ── READINESS SCORE ───────────────────────────────────────────
def calculate_readiness_score(student) -> tuple[float, dict]:
    """
    Returns (score, snapshot_dict).
    Snapshot is stored in ProgressTracking.score_snapshot for history.

    Weights:
      CGPA            30%
      LeetCode        25%
      Skills          20%
      Projects        15%
      Internships     10%
    """
    cgpa_score        = 0.0
    leetcode_score    = 0.0
    skills_score      = 0.0
    projects_score    = 0.0
    internships_score = 0.0

    if student.cgpa:
        cgpa_score = (student.cgpa / 10) * 30

    if student.leetcode_count:
        # 200 problems = full score. Caps at 25.
        leetcode_score = min(student.leetcode_count / 200, 1.0) * 25

    skills_count = len(student.skills) if student.skills else 0
    # 10 skills = full score. Caps at 20.
    skills_score = min(skills_count / 10, 1.0) * 20

    projects_count = len(student.projects) if student.projects else 0
    # 3 projects = full score. Caps at 15.
    projects_score = min(projects_count / 3, 1.0) * 15

    internships_count = len(student.internships) if student.internships else 0
    # 2 internships = full score. Caps at 10.
    internships_score = min(internships_count / 2, 1.0) * 10

    total = cgpa_score + leetcode_score + skills_score + projects_score + internships_score

    snapshot = {
        "cgpa":              student.cgpa,
        "cgpa_score":        round(cgpa_score, 2),
        "leetcode_count":    student.leetcode_count or 0,
        "leetcode_score":    round(leetcode_score, 2),
        "skills_count":      skills_count,
        "skills_score":      round(skills_score, 2),
        "projects_count":    projects_count,
        "projects_score":    round(projects_score, 2),
        "internships_count": internships_count,
        "internships_score": round(internships_score, 2),
        "total":             round(total, 2),
    }

    return round(total, 2), snapshot


# ── MAIN PIPELINE ─────────────────────────────────────────────
def run_agentic_pipeline(student_id: str, trigger: str = "profile_update"):
    """
    Full agentic analysis pipeline. Runs in background after every:
      - Profile create / update  (trigger="profile_create" / "profile_update")
      - Skill marked as learned  (trigger="skill_marked")

    Steps:
      1. Load student with all relations
      2. For each company: determine eligibility + calculate skill gap
      3. For eligible / near_eligible: generate Gemini roadmap
      4. Calculate readiness score and save snapshot
    """
    db: Session = SessionLocal()

    try:
        print(f"[PIPELINE] Starting — student: {student_id}, trigger: {trigger}")

        # ── STEP 1: Load student ──────────────────────────────
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            print(f"[PIPELINE] Student not found: {student_id}")
            return

        student_skills = [s.skill_name for s in student.skills]
        print(f"[PIPELINE] Student: {student.name} | Skills: {len(student_skills)}")

        # ── STEP 2: Eligibility + Skill Gap per company ───────
        companies = db.query(Company).all()
        print(f"[PIPELINE] Analysing against {len(companies)} companies")

        eligible_companies = []

        for company in companies:
            required_skills = company.required_skills or []

            # Determine eligibility
            status = determine_eligibility(student, company)

            # Calculate detailed skill gap
            gap = calculate_skill_gap(student_skills, required_skills)

            # Upsert eligibility result
            existing = db.query(EligibilityResult).filter(
                EligibilityResult.student_id == student_id,
                EligibilityResult.company_id  == company.id
            ).first()

            if existing:
                existing.status    = status
                existing.skill_gap = gap
                existing.analyzed_at = datetime.utcnow()
            else:
                db.add(EligibilityResult(
                    student_id=student_id,
                    company_id=company.id,
                    status=status,
                    skill_gap=gap,
                ))

            db.commit()
            print(f"[PIPELINE] {company.name}: {status}")

            if status in ("eligible", "near_eligible"):
                eligible_companies.append(company.name)

            # ── STEP 3: Gemini roadmap for eligible/near_eligible ──
            if status in ("eligible", "near_eligible"):
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
                    Recommendation.company_id  == company.id
                ).first()

                if existing_rec:
                    existing_rec.roadmap      = roadmap
                    existing_rec.generated_at = datetime.utcnow()
                else:
                    db.add(Recommendation(
                        student_id=student_id,
                        company_id=company.id,
                        roadmap=roadmap
                    ))

                db.commit()
                print(f"[PIPELINE] Roadmap saved for {company.name}")

        # ── STEP 4: Readiness score + progress snapshot ───────
        readiness_score, snapshot = calculate_readiness_score(student)
        snapshot["trigger"]             = trigger
        snapshot["eligible_companies"]  = eligible_companies
        snapshot["timestamp"]           = datetime.utcnow().isoformat()

        student.readiness_score = readiness_score

        db.add(ProgressTracking(
            student_id=student_id,
            readiness_score=readiness_score,
            score_snapshot=snapshot,
        ))
        db.commit()

        print(f"[PIPELINE] Done — readiness: {readiness_score}% | eligible: {eligible_companies}")

    except Exception as e:
        print(f"[PIPELINE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()

    finally:
        db.close()