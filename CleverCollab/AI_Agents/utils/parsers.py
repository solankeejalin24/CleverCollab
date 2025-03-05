import json

def parse_jira_issues(content):
 
    issue_blocks = content.strip().split("----------------------------------------")
    issues = []
 
    for block in issue_blocks:
        lines = [line.strip() for line in block.split("\n") if line.strip()]
 
        issue_data = {
            "Key": "",
            "Issue Type": "",
            "Summary": "",
            "Description": "",
            "Acceptance Criteria": "",
            "Status": "",
            "Assignee": "",
            "Due Date": "",
            "Start Date": "",
            "Completed Date": "",
            "Estimated Hours": "",
            "Parent": "",
            "Skills": ""
        }
 
        current_field = None
        acceptance_criteria = []
 
        for line in lines:
            if line.startswith("Key:"):
                issue_data["Key"] = line.replace("Key:", "").strip()
            elif line.startswith("Issue Type:"):
                issue_data["Issue Type"] = line.replace("Issue Type:", "").strip()
            elif line.startswith("Summary:"):
                issue_data["Summary"] = line.replace("Summary:", "").strip()
            elif line.startswith("Description:"):
                issue_data["Description"] = line.replace("Description:", "").strip()
                current_field = "Description"
            elif line.startswith("Acceptance Criteria"):
                current_field = "Acceptance Criteria"
            elif line.startswith("Status:"):
                issue_data["Status"] = line.replace("Status:", "").strip()
            elif line.startswith("Assignee:"):
                issue_data["Assignee"] = line.replace("Assignee:", "").strip()
            elif line.startswith("Due Date:"):
                issue_data["Due Date"] = line.replace("Due Date:", "").strip()
            elif line.startswith("Start Date:"):
                issue_data["Start Date"] = line.replace("Start Date:", "").strip()
            elif line.startswith("Completed Date:"):
                issue_data["Completed Date"] = line.replace("Completed Date:", "").strip()
            elif line.startswith("Estimated Hours:"):
                issue_data["Estimated Hours"] = line.replace("Estimated Hours:", "").strip()
            elif line.startswith("Parent:"):
                issue_data["Parent"] = line.replace("Parent:", "").strip()
            else:
                if current_field == "Acceptance Criteria":
                    acceptance_criteria.append(line)
 
        issue_data["Acceptance Criteria"] = "\n".join(acceptance_criteria)
 
        if any(value for value in issue_data.values()):
            issues.append(issue_data)
 
    return issues

class Employee:
    def __init__(self, name, title, skills):
        self.name = name
        self.title = title
        self.skills = skills

    def to_dict(self):
        return {
            "name": self.name,
            "title": self.title,
            "skills": self.skills
        }


def parse_employees(content):
    # Parse the JSON content
    employees_data = json.loads(content)
    
    # Create a list to store employee objects
    employees = []
    
    # Create employee objects and add them to the list
    for emp in employees_data:
        employee = Employee(emp["Name"], emp["Title"], emp["Skills"])
        employees.append(employee)
    
    return employees