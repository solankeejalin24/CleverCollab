# import os
# from dotenv import load_dotenv
# from openai import OpenAI
# import faiss
# import numpy as np
# import json

# # Load environment variables
# load_dotenv()

# # -------------------------
# # 1. Parse the TXT Files (Tasks and Employees)
# # -------------------------
# def parse_issues_from_txt(file_path):
#     with open(file_path, 'r', encoding='utf-8') as f:
#         content = f.read()
    
#     issue_blocks = content.strip().split("----------------------------------------")
#     issues = []
    
#     for block in issue_blocks:
#         lines = [line.strip() for line in block.split("\n") if line.strip()]
        
#         issue_data = {
#             "Key": "",
#             "Issue Type": "",
#             "Summary": "",
#             "Description": "",
#             "Acceptance Criteria": "",
#             "Status": "",
#             "Assignee": "",
#             "Due Date": "",
#             "Start Date": "",
#             "Completed Date": "",
#             "Estimated Hours": "",
#             "Parent": "",
#             "Required Skills": ""  # New field for skill matching
#         }
        
#         current_field = None
#         acceptance_criteria = []
        
#         for line in lines:
#             if line.startswith("Key:"):
#                 issue_data["Key"] = line.replace("Key:", "").strip()
#             elif line.startswith("Required Skills:"):
#                 issue_data["Required Skills"] = line.replace("Required Skills:", "").strip()
#             elif line.startswith("Issue Type:"):
#                 issue_data["Issue Type"] = line.replace("Issue Type:", "").strip()
#             elif line.startswith("Summary:"):
#                 issue_data["Summary"] = line.replace("Summary:", "").strip()
#             elif line.startswith("Description:"):
#                 issue_data["Description"] = line.replace("Description:", "").strip()
#                 current_field = "Description"
#             elif line.startswith("Acceptance Criteria"):
#                 current_field = "Acceptance Criteria"
#             elif line.startswith("Status:"):
#                 issue_data["Status"] = line.replace("Status:", "").strip()
#             elif line.startswith("Assignee:"):
#                 issue_data["Assignee"] = line.replace("Assignee:", "").strip()
#             elif line.startswith("Due Date:"):
#                 issue_data["Due Date"] = line.replace("Due Date:", "").strip()
#             elif line.startswith("Start Date:"):
#                 issue_data["Start Date"] = line.replace("Start Date:", "").strip()
#             elif line.startswith("Completed Date:"):
#                 issue_data["Completed Date"] = line.replace("Completed Date:", "").strip()
#             elif line.startswith("Estimated Hours:"):
#                 issue_data["Estimated Hours"] = line.replace("Estimated Hours:", "").strip()
#             elif line.startswith("Parent:"):
#                 issue_data["Parent"] = line.replace("Parent:", "").strip()
#             else:
#                 if current_field == "Acceptance Criteria":
#                     acceptance_criteria.append(line)
        
#         issue_data["Acceptance Criteria"] = "\n".join(acceptance_criteria)
        
#         if any(value for value in issue_data.values()):
#             issues.append(issue_data)
    
#     return issues

# def parse_employee_skills(file_path):
#     with open(file_path, 'r', encoding='utf-8') as f:
#         employees = json.load(f)  # Assumes JSON format
#     return employees

# # -------------------------
# # 2. Build a Vector Store (FAISS) for Tasks and Employees
# # -------------------------
# def build_vector_store(client, issues, employees):
#     texts = []
#     metadata = []
    
#     for issue in issues:
#         combined_text = (
#             f"[TASK]\nKey: {issue['Key']}\n"
#             f"Issue Type: {issue['Issue Type']}\n"
#             f"Summary: {issue['Summary']}\n"
#             f"Description: {issue['Description']}\n"
#             f"Acceptance Criteria: {issue['Acceptance Criteria']}\n"
#             f"Status: {issue['Status']}\n"
#             f"Assignee: {issue['Assignee']}\n"
#             f"Due Date: {issue['Due Date']}\n"
#             f"Start Date: {issue['Start Date']}\n"
#             f"Completed Date: {issue['Completed Date']}\n"
#             f"Estimated Hours: {issue['Estimated Hours']}\n"
#             f"Parent: {issue['Parent']}\n"
#         )
#         texts.append(combined_text)
#         metadata.append({"type": "task", **issue})
    
#     for employee in employees:
#         combined_text = (
#             f"[EMPLOYEE]\nEmployee Name: {employee['Name']}\n"
#             f"Title: {employee['Title']}\n"
#             f"Skills: {', '.join(employee['Skills'])}\n"
#         )
#         texts.append(combined_text)
#         metadata.append({"type": "employee", **employee})
    
#     vectors = [
#         client.embeddings.create(model="text-embedding-ada-002", input=[txt]).data[0].embedding
#         for txt in texts
#     ]
    
#     vectors = np.array(vectors, dtype='float32')
#     dim = vectors.shape[1]
#     index = faiss.IndexFlatL2(dim)
#     index.add(vectors)
    
#     return index, texts, metadata

# # -------------------------
# # 3. Retrieve Relevant Issues
# # -------------------------
# def retrieve_relevant_issues(client, query, index, texts, metadata, top_k=5):
#     """
#     Given a user query, embed it, perform a similarity search on the FAISS index,
#     and return the top_k relevant pieces of context along with metadata.
#     """
#     response = client.embeddings.create(
#         model="text-embedding-ada-002",
#         input=[query]
#     )
    
#     query_embedding = np.array([response.data[0].embedding], dtype='float32')

#     # Search the FAISS index for top-k closest matches
#     distances, indices = index.search(query_embedding, top_k)

#     results = []
#     for dist, idx in zip(distances[0], indices[0]):
#         results.append((texts[idx], metadata[idx], dist))

#     return results

# # -------------------------
# # 4. Expert PM Answer (with Updated Prompt)
# # -------------------------
# def expert_pm_answer(client, query, index, texts, metadata, top_k=5):
#     # Retrieve top_k relevant context
#     retrieved = retrieve_relevant_issues(client, query, index, texts, metadata, top_k=top_k)
    
#     # Combine the text from each relevant piece into a single context string
#     context = "\n\n---\n\n".join([res[0] for res in retrieved])
    
#     # Updated system instructions
#     system_message = (
#         "You are an Expert Project Manager. You have knowledge of the following tasks and employees. "
#         "You can perform: "
#         "1) Task Prioritization based on due dates, dependencies, and statuses. "
#         "2) Skill Matching by comparing tasks’ required skills with the employees’ skills. "
#         "Only refer to employees and tasks that appear in the context. "
#         "If the user asks about an employee or task not in the context, you must explicitly state that you do not have information for them. "
#         "Never fabricate new employees or tasks."
#         #"Only use information from the data provided in the context. "
#         "If you do not have enough information, clearly state that you cannot determine the answer from the provided data.\n\n"

#         f"CONTEXT:\n{context}\n"
#         "------------------------\n"
#         "User Query:"
#     )

#     print(system_message)

    
#     # Prepare messages for Chat Completion
#     messages = [
#         {"role": "system", "content": system_message},
#         {"role": "user", "content": query},
#     ]
    
#     # Call the Chat Completion API
#     response = client.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=messages,
#         temperature=0
#     )
    
#     # Return the generated answer
#     return response.choices[0].message.content


# # -------------------------
# # 5. Main Execution
# # -------------------------
# def main():
#     api_key = os.getenv("API_TOKEN_GPT_MODEL")
#     client = OpenAI(api_key=api_key)
    
#     issues = parse_issues_from_txt("./jira_issues.txt")
#     employees = parse_employee_skills("./employee_skill.txt")
    
#     index, texts, meta = build_vector_store(client, issues, employees)
    
#     # query = "I want to assign task PN2-32 to two employees. Can you suggest which employees are best suited for this task? Also suggest who should be the lead."
#     #query = "I want to create a full-stack web application. Can you suggest which employees are best suited for this task?"
#     query = "Considering the time needed for each task, can Jalin Solankee meet all the deadlines?"
#     answer = expert_pm_answer(client, query, index, texts, meta)
    
#     print("Q:", query)
#     print("A:", answer)

# if __name__ == "__main__":
#     main()

import os
from dotenv import load_dotenv
from openai import OpenAI
import faiss
import numpy as np
import json

# Load environment variables
load_dotenv()

# -------------------------
# 1. Parse the JSON Files (Tasks and Employees)
# -------------------------
def parse_issues_from_json(file_path):
    """
    Reads a JSON file containing an array of issue objects.
    Each object in the array should have the keys:
      Key, IssueType, Summary, Description, AcceptanceCriteria (array),
      Status, Assignee, DueDate, StartDate, CompletedDate,
      EstimatedHours, Parent, RequiredSkills (array or empty)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        issues = json.load(f)
    return issues

def parse_employee_skills(file_path):
    """
    Reads a JSON file containing an array of employee objects.
    Each object should have the keys: Name, Title, Skills
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        employees = json.load(f)
    return employees

# -------------------------
# 2. Build a Vector Store (FAISS) for Tasks and Employees
# -------------------------
def build_vector_store(client, issues, employees):
    """
    Creates a FAISS index by embedding each task and each employee into vectors.
    Each text is stored in 'texts' and its corresponding metadata in 'metadata'.
    """
    texts = []
    metadata = []
    
    # Process each issue into a text snippet
    for issue in issues:
        # Convert acceptance criteria (array) into a single string
        acceptance_criteria = "\n".join(issue.get("AcceptanceCriteria", []))
        # Convert required skills (array) into a comma-separated string
        required_skills = ", ".join(issue.get("RequiredSkills", []))
        
        combined_text = (
            f"[TASK]\n"
            f"Key: {issue.get('Key', '')}\n"
            f"Summary: {issue.get('Summary', '')}\n"
            f"Required Skills: {required_skills}\n"
            f"Description: {issue.get('Description', '')}\n"
            f"Acceptance Criteria: {acceptance_criteria}\n"
        )
        
        texts.append(combined_text)
        # Store all issue data in metadata, plus 'type' = 'task'
        issue_metadata = {"type": "task"}
        issue_metadata.update(issue)
        metadata.append(issue_metadata)
    
    # Process each employee into a text snippet
    for employee in employees:
        combined_text = (
            f"[EMPLOYEE]\n"
            f"Employee Name: {employee.get('Name', '')}\n"
            f"Title: {employee.get('Title', '')}\n"
            f"Skills: {', '.join(employee.get('Skills', []))}\n"
        )
        
        texts.append(combined_text)
        # Store all employee data in metadata, plus 'type' = 'employee'
        employee_metadata = {"type": "employee"}
        employee_metadata.update(employee)
        metadata.append(employee_metadata)
    
    # Convert texts to embedding vectors
    vectors = [
        client.embeddings.create(model="text-embedding-ada-002", input=[txt]).data[0].embedding
        for txt in texts
    ]
    
    # Convert to a float32 NumPy array (required by FAISS)
    vectors = np.array(vectors, dtype='float32')
    dim = vectors.shape[1]
    
    # Create the FAISS index
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)
    
    return index, texts, metadata

# -------------------------
# 3. Retrieve Relevant Issues
# -------------------------
def retrieve_relevant_issues(client, query, index, texts, metadata, top_k=5):
    """
    Given a user query, embed it, perform a similarity search on the FAISS index,
    and return the top_k relevant pieces of context along with their metadata.
    """
    # Get embedding for user query
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=[query]
    )
    
    query_embedding = np.array([response.data[0].embedding], dtype='float32')

    # Perform similarity search on FAISS index
    distances, indices = index.search(query_embedding, top_k)
    
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        results.append((texts[idx], metadata[idx], dist))

    return results

# -------------------------
# 4. Expert PM Answer (with skill matching & prioritization)
# -------------------------
def expert_pm_answer(client, query, index, texts, metadata, top_k=5):
    # Retrieve top_k relevant context from the vector store
    retrieved = retrieve_relevant_issues(client, query, index, texts, metadata, top_k=top_k)
    
    # Combine the text from each relevant piece into a single context string
    context = "\n\n---\n\n".join([res[0] for res in retrieved])
    
    # Updated system instructions
    system_message = (
        "You are an Expert Project Manager. You have knowledge of the following tasks and employees. "
        "You can perform: "
        "1) Task Prioritization based on due dates, dependencies, and statuses. "
        "2) Skill Matching by comparing tasks’ required skills with the employees’ skills. "
        "Only refer to employees and tasks that appear in the context. "
        "If the user asks about an employee or task not in the context, you must explicitly state that you do not have information for them. "
        "Never fabricate new employees or tasks. "
        "If you do not have enough information, clearly state that you cannot determine the answer from the provided data.\n\n"

        f"CONTEXT:\n{context}\n"
        "------------------------\n"
        "User Query:"
    )
    print(system_message)
    # Prepare messages for Chat Completion
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": query},
    ]
    
    # Call the Chat Completion API
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0
    )
    
    # Return the generated answer
    return response.choices[0].message.content

# -------------------------
# 5. Main Execution
# -------------------------
def main():
    api_key = os.getenv("API_TOKEN_GPT_MODEL")
    client = OpenAI(api_key=api_key)
    
    # READ FROM JSON INSTEAD OF TXT
    issues = parse_issues_from_json("./jira_issues_json.txt")
    employees = parse_employee_skills("./employee_skill.txt")
    
    # Build the FAISS vector store
    index, texts, meta = build_vector_store(client, issues, employees)
    
    # Example query
    query = "Considering the time needed for each task, can Jalin Solankee meet all the deadlines?"
    answer = expert_pm_answer(client, query, index, texts, meta, top_k=5)
    
    print("Q:", query)
    print("A:", answer)

if __name__ == "__main__":
    main()
