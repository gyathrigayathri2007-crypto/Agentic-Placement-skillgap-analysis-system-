import pandas as pd
import io

def generate_excel_report(students: list) -> bytes:
    data = []

    for student in students:
        skills = ", ".join([s.skill_name for s in student.skills]) if student.skills else ""
        eligible_companies = [
            e.company.name for e in student.eligibility_results
            if e.status == "eligible"
        ] if student.eligibility_results else []

        data.append({
            "Name": student.name,
            "Department": student.department or "",
            "Year": student.year or "",
            "Section": student.section or "",
            "CGPA": student.cgpa or 0,
            "Skills": skills,
            "LeetCode Solved": student.leetcode_count or 0,
            "HackerRank Score": student.hackerrank_score or 0,
            "Readiness Score (%)": student.readiness_score or 0,
            "Eligible Companies": ", ".join(eligible_companies)
        })

    df = pd.DataFrame(data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Students Report")

        worksheet = writer.sheets["Students Report"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            worksheet.column_dimensions[column_letter].width = min(max_length + 2, 40)

    return output.getvalue()