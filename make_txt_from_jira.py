import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class JiraAPI:
    def __init__(self, base_url, user, api_token):
        self.base_url = base_url
        self.user = user
        self.api_token = api_token
        self.headers = {
            "Accept": "application/json",
            "Content": "application/json",
        }

    def get_issues(self, jql, max_results=1000):
        start_at = 0
        all_issues = []

        while True:
            api_url = f"{self.base_url}?jql={jql}&maxResults={max_results}&startAt={start_at}"
            response = requests.get(api_url, headers=self.headers, auth=(self.user, self.api_token))

            if response.status_code != 200:
                print(f"Error: {response.status_code} - {response.text}")
                break

            data = response.json()
            issues = data.get("issues", [])
            all_issues.extend(issues)

            # Check if there are more issues to fetch
            if len(issues) < max_results:
                break

            start_at += max_results

        return all_issues


class Issue:
    def __init__(self, issue_data):
        self.key = issue_data.get("key")
        self.fields = issue_data.get("fields", {})
        self.summary = self.fields.get("summary")
        self.issue_type = self.fields.get("issuetype", {}).get("name")
        self.status = self.fields.get("status", {}).get("name")
        self.assignee = self.fields.get("assignee", {}).get("displayName") if self.fields.get("assignee") else "Unassigned"
        self.due_date = self.fields.get("duedate")
        self.start_date = self.fields.get("customfield_10015")
        self.completed_date = self.fields.get("customfield_10062")
        self.estimated_hours = self.fields.get("customfield_10040")
        self.description = self.extract_description()
        self.parent_info = self.extract_parent()

    def extract_description(self):
        description = self.fields.get("description", {})
        description_text = []

        if description.get('type') == 'doc' and description.get('content'):
            for paragraph in description['content']:
                for content_item in paragraph['content']:
                    if content_item['type'] == 'text':
                        description_text.append(content_item['text'])
        
        return '\n'.join(description_text)

    def extract_parent(self):
        parent = self.fields.get('parent', {})
        if parent:
            parent_name = parent.get('fields', {}).get('summary', 'No Parent Name')
            parent_key = parent.get('key', 'No Parent ID')
            return f"{parent_key} - {parent_name}"
        else:
            return "No Parent"

    def format_data(self):
        issue_data = {
            "Key": self.key,
            "Issue Type": self.issue_type,
            "Summary": self.summary,
            "Description": self.description,
            "Status": self.status,
            "Assignee": self.assignee,
            "Due Date": self.due_date,
            "Start Date": self.start_date,
            "Completed Date": self.completed_date,
            "Estimated Hours": self.estimated_hours,
            "Parent": self.parent_info,
        }

        formatted_data = ""
        for key, value in issue_data.items():
            formatted_data += f"{key}: {value}\n"
        formatted_data += "-" * 40 + "\n"

        return formatted_data


def main():
    # Get credentials from environment variables
    base_url = os.getenv("BASE_URL")
    user = os.getenv("USER")
    api_token = os.getenv("API_TOKEN")

    # Initialize JiraAPI object
    jira_api = JiraAPI(base_url, user, api_token)

    # Define your JQL query to fetch issues
    jql = "issuetype in (Story) AND project = PN2"

    # Get issues from Jira API
    issues_data = jira_api.get_issues(jql)

    print(f"Total issues fetched: {len(issues_data)}")

    # Write issues to a .txt file
    output_file = "jira_issues.txt"
    with open(output_file, "w") as file:
        file.write(f"Total issues fetched: {len(issues_data)}\n\n")
        for issue_data in issues_data:
            issue = Issue(issue_data)
            file.write(issue.format_data())

    print(f"Issues written to {output_file}")


if __name__ == "__main__":
    main()
