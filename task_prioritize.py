import os
from dotenv import load_dotenv
from openai import OpenAI
import faiss
import numpy as np


 
# -------------------------
# 1. Parse the TXT File
# -------------------------
load_dotenv()

def parse_issues_from_txt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
 
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
 
# -------------------------
# 2. Build a Vector Store (FAISS)
# -------------------------
def build_vector_store(client, issues):
    texts = []
    metadata = []
 
    for issue in issues:
        combined_text = (
            f"Key: {issue['Key']}\n"
            f"Issue Type: {issue['Issue Type']}\n"
            f"Summary: {issue['Summary']}\n"
            f"Description: {issue['Description']}\n"
            f"Acceptance Criteria: {issue['Acceptance Criteria']}\n"
            f"Status: {issue['Status']}\n"
            f"Assignee: {issue['Assignee']}\n"
            f"Due Date: {issue['Due Date']}\n"
            f"Start Date: {issue['Start Date']}\n"
            f"Completed Date: {issue['Completed Date']}\n"
            f"Estimated Hours: {issue['Estimated Hours']}\n"
            f"Parent: {issue['Parent']}\n"
        )
        texts.append(combined_text)
        metadata.append(issue)
 
    vectors = []
    for txt in texts:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=[txt]
        )
        embedding = response.data[0].embedding
        vectors.append(embedding)
 
    vectors = np.array(vectors, dtype='float32')
 
    dim = vectors.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)
 
    return index, texts, metadata
 
# -------------------------
# 3. Retrieval Function
# -------------------------
def retrieve_relevant_issues(client, query, index, texts, metadata):
    # response = client.embeddings.create(
    #     model="text-embedding-ada-002",
    #     input=[query]
    # )
    # query_embedding = np.array([response.data[0].embedding], dtype='float32')
 
    # distances, indices = index.search(query_embedding, top_k)
 
    # results = []
    # for dist, idx in zip(distances[0], indices[0]):
    #     results.append((texts[idx], metadata[idx], dist))
 
    # return results
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=[query]
    )
    query_embedding = np.array([response.data[0].embedding], dtype='float32')
   
    # Get ALL tasks from the index
    distances, indices = index.search(query_embedding, index.ntotal)
   
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        results.append((texts[idx], metadata[idx], dist))
   
    return results
 
# -------------------------
# 4. Q&A / Expert PM Logic
# -------------------------
def expert_pm_answer(client, query, index, texts, metadata):
    retrieved = retrieve_relevant_issues(client, query, index, texts, metadata)
 
    context = "\n\n---\n\n".join([res[0] for res in retrieved])
    # print(context)
 
    system_message = (
        "You are an Expert Project Manager. You have knowledge of the following project issues. "
        "Dates in the provided data are formatted as yyyy-mm-dd. Use this information to answer the user query accurately and helpfully."
        "Make sure you take into account the employee name provided to you and if the information provided does not have the employee name, then tell the manager that."
        "The answer should be based on the skills of the Employee, but it should focus on all the details provided to you in the context.\n\n"
        f"CONTEXT:\n{context}\n"
        "------------------------\n"
        "User Query: "
    )
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": query},
    ]
 
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0
    )
 
    return response.choices[0].message.content
 
# -------------------------
# 5. Putting It All Together
# -------------------------
def main():
    # Set your OpenAI API Key
    api_key = os.getenv("API_TOKEN_GPT_MODEL")
    client = OpenAI(api_key=api_key)
 
    # 1. Parse issues from your TXT file
    file_path = "./jira_issues.txt"
    issues = parse_issues_from_txt(file_path)
 
    # 2. Build the vector store
    index, texts, meta = build_vector_store(client, issues)
 
    # 3. Ask a sample question
    query = "Considering the time needed for each task, can Jalin Solankee meet all the deadlines?"
    answer = expert_pm_answer(client, query, index, texts, meta)
 
    print("Q:", query)
    print("A:", answer)
 
if __name__ == "__main__":
    main()