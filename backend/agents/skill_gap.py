def calculate_skill_gap(student_skills: list, required_skills: list) -> dict:
    student_skills_lower = [s.lower() for s in student_skills]
    gap = {}

    for skill in required_skills:
        skill_lower = skill.lower()
        if skill_lower in student_skills_lower:
            gap[skill] = {
                "student_level": 60,
                "required_level": 85,
                "has_skill": True
            }
        else:
            gap[skill] = {
                "student_level": 0,
                "required_level": 85,
                "has_skill": False
            }

    return gap