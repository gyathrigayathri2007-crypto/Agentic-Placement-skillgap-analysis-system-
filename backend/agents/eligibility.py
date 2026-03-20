def determine_eligibility(student, company) -> str:
    student_skills = [s.skill_name.lower() for s in student.skills]
    required_skills = [s.lower() for s in (company.required_skills or [])]

    # Calculate skill match percentage
    if required_skills:
        matched = sum(1 for s in required_skills if s in student_skills)
        skill_match = matched / len(required_skills)
    else:
        skill_match = 1.0

    cgpa = student.cgpa or 0
    cutoff = company.cgpa_cutoff or 0

    # ELIGIBLE: cgpa meets cutoff AND 50%+ skills matched
    if cgpa >= cutoff and skill_match >= 0.5:
        return "eligible"

    # NEAR ELIGIBLE: cgpa within 0.5 of cutoff AND 30%+ skills matched
    elif cgpa >= (cutoff - 0.5) and skill_match >= 0.3:
        return "near_eligible"

    # NOT ELIGIBLE
    else:
        return "not_eligible"