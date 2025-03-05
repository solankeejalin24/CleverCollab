from langchain_core.prompts import ChatPromptTemplate

class PriorityAgent:
    def __init__(self, llm):
        self.llm = llm
        self.prompt = ChatPromptTemplate.from_template("""
        Analyze task deadlines considering:
        - Due Date: {due_date}
        - Estimated Hours: {hours}
        - Dependencies: {dependencies}
        - Assignee's Current Workload: {workload}h

        Output format:
        ```
        Priority: [High/Medium/Low]
        Reasoning: [analysis]
        ```
        """)

    def prioritize(self, task, workload):
        response = self.llm(self.prompt.format(
            due_date=task['Due Date'],
            hours=task['Estimated Hours'],
            dependencies=task.get('Parent', 'None'),
            workload=workload
        ))
        return response.content
