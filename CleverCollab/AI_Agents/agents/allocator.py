from langchain_core.prompts import ChatPromptTemplate

class AllocationAgent:
    def __init__(self, llm, employees):
        self.llm = llm
        self.employees = employees
        self.prompt = ChatPromptTemplate.from_template("""
        Consider:
        - Required Skills: {skills}
        - Employee Skills: {employee_skills}
        - Availability: {availability}h/week

        Output format:
        ```
        Recommendation: [name]
        Match Score: [0-100]%
        ```
        """)

    def allocate(self, task):
        best_match = None
        best_score = 0
        for employee in self.employees:
            availability = 40 - sum(float(t['Estimated Hours']) for t in employee.get('current_tasks', []))
            response = self.llm(self.prompt.format(
                skills=", ".join(task.get('Skills', [])),
                employee_skills=", ".join(employee.get('skills', [])),
                availability=availability
            ))
            name, score = response.content.split('|')
            score = int(score.strip().rstrip('%'))
            if score > best_score:
                best_match = employee['name']
                best_score = score
        return f"Recommended: {best_match} | Match Score: {best_score}%"
