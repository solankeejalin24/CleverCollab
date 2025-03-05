from json import tool
from langchain.agents import AgentExecutor, Tool, create_react_agent
from langchain.prompts import PromptTemplate
from agents.skill_matcher import SkillMatcher
from agents.prioritizer import PriorityAgent
from agents.allocator import AllocationAgent
from utils.parsers import parse_jira_issues, parse_employees
from utils.workload_calculator import calculate_workload
from config import llm
import json

import openai
import time

# Load data
with open("data/jira_issues.txt") as f:
    issues = parse_jira_issues(f.read())
    
with open("data/employee_details.txt") as f:
    employees = parse_employees(f.read())

# Initialize agents
skill_matcher = SkillMatcher(employees)
prioritizer = PriorityAgent(llm)
allocator = AllocationAgent(llm, employees)

def find_employee(employees, name):
    for e in employees:
        if e["Name"] == name:
            return e
    return None

# Create agent tools
tools = [
    Tool(
        name="SkillMatcher",
        func=lambda skills: skill_matcher.find_match(skills),
        description="Find employees with specific skills. Input format: {'skills': ['Python', 'ML']}"
    ),
    Tool(
        name="WorkloadCalculator",
        func=lambda name: calculate_workload(find_employee(employees, name)),
        description="Calculate workload for an employee. Input format: {'name': 'John Doe'}"
    ),
    Tool(
        name="TaskAllocator",
        func=allocator.allocate,
        description="Allocate tasks based on skills and workload. Input format: {'task': task_data}"
    ),
    Tool(
        name="TaskPrioritizer",
        func=lambda task_key: prioritizer.prioritize(
            next(t for t in issues if t['Key'] == task_key),
            calculate_workload(next(e for e in employees if e.name == task_key))
        ),
        description="Prioritize a task. Input format: {'task_key': 'PN2-53'}"
    )
]

# Extract tool details
tool_names = ", ".join([tool.name for tool in tools])
tool_descriptions = "\n".join([f"- {tool.name}: {tool.description}" for tool in tools])

# Create master agent prompt
master_prompt = PromptTemplate.from_template("""
You are an AI Project Management Assistant that follows the ReAct reasoning framework.

### **Usage Instructions**
You have access to the following tools to retrieve and process information effectively:

**Available Tools:**
{tools}

### **ReAct Format**
Question: {input} 
Thought: Think step by step before taking action. 
Action: Choose an action to take from [{tool_names}] 
Action Input: {{"param": "value"}} (valid JSON format) 
Observation: The result of the action. ... (repeat Thought → Action → Action Input → Observation as needed) 
Thought: I now have enough information. 
Final Answer: The final answer to the original question.

### **Context Information**
- **Current Projects:** {projects}
- **Team Members:** {team}

Begin reasoning below.

{agent_scratchpad}
""")

# master_prompt = PromptTemplate.from_template("""
# Answer the following questions as best you can. You have access to the following tools:

# {tools}

# Use the following format:

# Question: {input}
# Thought: You should always think about what to do next.
# Action: The action to take, should be one of [{tool_names}]
# Action Input: The input to the action
# Observation: The result of the action
# ... (this Thought/Action/Action Input/Observation can repeat N times)
# Thought: I now know the final answer
# Final Answer: The final answer to the original question

# {agent_scratchpad}
# """)
# master_prompt = PromptTemplate.from_template("""
# You are a Project Management AI Assistant that uses the ReAct reasoning framework.
# Follow the format strictly:

# **Format**
# Thought: You should think step by step before deciding an action.
# Action: Call one of the available tools in this format → `Action: tool_name[input]`
# Observation: The result of the action execution.
# (Repeat Thought, Action, Observation cycle if needed)
# Final Answer: Provide the final answer only after gathering necessary observations.

# **Available Tools**
# {tool_names}

# **Tool Details**
# {tools}

# **Current Projects**
# {projects}

# **Team Members**
# {team}

# Answer the following query: {input}
# Provide a detailed explanation of your reasoning.

# {agent_scratchpad}
# """)

# Create master agent
agent = create_react_agent(
    llm=llm,
    tools=tools,
    prompt=master_prompt.partial(tools=tool_descriptions, tool_names=tool_names)
)

# Initialize agent executor with error handling
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True, max_iterations=3)


# API Rate Limit Handling (Retry Mechanism)
def safe_invoke(query, max_retries=5):
    retries = 0
    while retries < max_retries:
        try:
            response = agent_executor.invoke({
                "input": query,
                "projects": json.dumps(issues, indent=2),
                "team": json.dumps([e.to_dict() for e in employees], indent=2),
                "agent_scratchpad": ""  # Required for ReAct format
            })
            return response['output']
        except openai.OpenAIError:  # ✅ Fixed incorrect OpenAI error handling
            wait_time = (2 ** retries) * 5  # Exponential backoff (5s, 10s, 20s, ...)
            print(f"⚠️ API Rate Limit Hit! Retrying in {wait_time} seconds...")
            time.sleep(wait_time)
            retries += 1
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return None
    print("🚨 Maximum retries reached! Please try again later.")
    return None

# Test Cases
print(safe_invoke("Can Jalin meet all deadlines?"))
print(safe_invoke("Who is the best employee for a full-stack development task?"))

# Interactive Mode
if __name__ == "__main__":
    while True:
        user_input = input("Enter your query (or 'quit' to exit): ")
        if user_input.lower() == 'quit':
            break
        print(safe_invoke(user_input))