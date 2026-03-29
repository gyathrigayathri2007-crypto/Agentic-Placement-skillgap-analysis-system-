# agents/eligibility.py

def determine_eligibility(student, company) -> str:
    student_skills = [s.skill_name.lower().strip() for s in student.skills]
    required_skills = [s.lower().strip() for s in (company.required_skills or [])]

    if required_skills:
        # Weight critical skills more heavily
        critical = {"data structures", "algorithms", "aptitude", "problem solving"}
        matched = 0
        total_weight = 0
        for s in required_skills:
            weight = 2.0 if s in critical else 1.0
            total_weight += weight
            if s in student_skills:
                matched += weight
        skill_match = matched / total_weight if total_weight > 0 else 1.0
    else:
        skill_match = 1.0

    cgpa = student.cgpa or 0
    cutoff = company.cgpa_cutoff or 0
    leetcode = student.leetcode_count or 0

    # Eligible: meets CGPA + 60%+ skill match
    if cgpa >= cutoff and skill_match >= 0.6:
        return "eligible"
    # Near eligible: close on CGPA + 35%+ skills, or strong skills compensate
    elif (cgpa >= cutoff - 0.5 and skill_match >= 0.35) or (cgpa >= cutoff and skill_match >= 0.35):
        return "near_eligible"
    else:
        return "not_eligible"