# agents/skill_gap.py

SKILL_WEIGHTS = {
    "python": 90, "java": 90, "data structures": 95, "algorithms": 95,
    "sql": 85, "react": 80, "machine learning": 85, "system design": 80,
    "aptitude": 90, "problem solving": 90, "communication": 75,
    "aws": 75, "git": 70, "operating systems": 80, "computer networks": 78,
    "dbms": 82, "c": 65, "c++": 70, "node.js": 72, "mongodb": 68,
    "docker": 68, "deep learning": 82, "angular": 70, "spring boot": 72,
    "power bi": 65, "tableau": 63, "linux": 67, "typescript": 70,
    "django": 68, "kubernetes": 60,
}

def get_proficiency_level(skill_name: str) -> str:
    """Map skill name to expected proficiency label."""
    skill_lower = skill_name.lower()
    if skill_lower in ["data structures", "algorithms", "aptitude", "problem solving"]:
        return "Advanced"
    elif skill_lower in ["python", "java", "sql", "system design", "machine learning"]:
        return "Intermediate-Advanced"
    else:
        return "Intermediate"

def calculate_skill_gap(student_skills: list, required_skills: list) -> dict:
    student_skills_lower = [s.lower().strip() for s in student_skills]
    gap = {}

    for skill in required_skills:
        skill_lower = skill.lower().strip()
        required_level = SKILL_WEIGHTS.get(skill_lower, 75)
        proficiency = get_proficiency_level(skill)

        if skill_lower in student_skills_lower:
            # Has the skill — assume moderate proficiency, flag if critical
            student_level = max(55, required_level - 25)
            gap[skill] = {
                "has_skill": True,
                "student_level": student_level,
                "required_level": required_level,
                "proficiency_target": proficiency,
                "gap_severity": "low" if student_level >= required_level - 10 else "medium",
                "action": "Deepen existing knowledge" if student_level < required_level else "Maintain skill"
            }
        else:
            gap[skill] = {
                "has_skill": False,
                "student_level": 0,
                "required_level": required_level,
                "proficiency_target": proficiency,
                "gap_severity": "critical" if required_level >= 85 else "high",
                "action": f"Learn {skill} to {proficiency} level"
            }

    return gap