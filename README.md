# Senior Design Report - CleverCollab

## Table of Contents
1.  [Team Names and Project Abstract](#team-names-and-project-abstract)
2.  [Project Description](#project-description)
3.  [User Interface Specification](#user-interface-specification)
4.  [Test Plan and Results](#test-plan-and-results)
5.  [User Manual](#user-manual)
6.  [Key Features](#key-features)
7.  [PPT Slideshow](#ppt-slideshow)
8.  [Final Expo Poster](#final-expo-poster)
9.  [Self-Assessments](#self-assessments)
    *   [Initial Self-Assessments](#initial-self-assessments)
    *   [Final Self-Assessments](#final-self-assessments)
10. [Summary of Hours and Justification](#summary-of-hours-and-justification)
    *   [Fall Semester Hours](#fall-semester-hours)
    *   [Spring Semester Hours](#spring-semester-hours)
11. [Summary of Expenses](#summary-of-expenses)
12. [User Stories and Design Diagrams](#user-stories-and-design-diagrams)
    *   [User Stories](#user-stories)
    *   [Design Diagrams](#design-diagrams)
13. [ABET Concerns Essay](#abet-concerns-essay)
    *   [Economic Constraints](#economic-constraints)
    *   [Professional Constraints](#professional-constraints)
    *   [Ethical Constraints](#ethical-constraints)
    *   [Security Constraints](#security-constraints)
15. [Appendix](#appendix)

## Team Names and Project Abstract
- Team members: Arya Narke, Varad Parte, Daksh Prajapati, Jalin Solankee
- Advisor: Dr. Raj Bhatnagar
### **Project Abstract**: 
Our project, Autonomous AI Agents for Project Management Automation, harnesses AI to transform project management with automated task allocation and task prioritization, predictive analytics, and natural language processing. Leveraging Jira API calls via Python, the backend efficiently retrieves and processes project data, which is stored in MongoDB databases. Machine learning models analyze this data to predict delays and resource needs. An intuitive frontend in React.js provides real-time insights and interactive dashboards, while a GPT-powered chatbot interface answers queries from team members and project managers. This system empowers proactive project oversight, optimizing task allocation, progress tracking, and decision-making for enhanced productivity and efficiency.​

## Project Description
### Overview
Managing projects require daily or weekly meetings where project managers gather updates, assess risks, and redistribute tasks to keep things on track. While these meetings are essential, they can be time-consuming, especially when using traditional tools that lack the ability to dynamically adapt to shifting priorities, team availability, and evolving project demands. Our project aims to enhance this process.

CleverCollab streamlines project management with one AI-powered app to handle task allocation, skill matching, and workload analysis using real-time data. It boosts productivity by hitting the sweet spot between automation & user control. Access is secure, ensuring only the organization can view its data. A built-in chatbot, powered by NLP, delivers answers to project-related queries, with no need for constant manual updates — the AI pulls fresh data with every query!

## User Interface Specification:
[**Link to User Interface Screenshots**](https://github.com/solankeejalin24/CleverCollab/blob/main/UIspecs)

## Test Plan and Results: 
### Test Plan
[**Link to Test Plan and Results**](https://github.com/solankeejalin24/CleverCollab/blob/main/TestPlan_Results.pdf)

### Results
- Achieved an overall 80% accuracy rate in key project management functions
- Decision-making chatbot that offers real-time query processing and provides a reliable tool to identify conflicts and predict risks with confidence
- AI agent that automates workflows by creating new tasks, assigning them to the right team members based on skills and availability, and prioritizing tasks 
- Not only benefits software development managers but also empowers teams across industries to manage projects more efficiently and proactively

## User Manual: 
[**Link to User Manual and Documentation**](https://github.com/solankeejalin24/CleverCollab/blob/main/User_Documentation_and_Manual.md)

## Key Features
- **Automated Task Allocation**: AI agents assign tasks based on team members' expertise and availability, ensuring optimal resource management.
- **Real-Time Progress Tracking**: Live updates on task progress, team performance, and project status.
- **Predictive Analytics**: Machine learning models analyze current project data to predict potential delays or bottlenecks and suggest strategic adjustments.
- **NLP Chatbot for Queries**: A chatbot powered by GPT models allows managers and team members to ask questions about the project’s status, tasks, and potential risks. The chatbot can answer both simple and complex queries in natural language.

### Technical Stack

#### Backend
- **Typescript**
- **Vercel AI SDK**
- **Python**
  
#### Frontend
- **Next.js**
- **Tailwind CSS**
- **Shacn UI**
  
#### API Integration & Database
- **JiraAPI**
- **Clerk API**
- **Gmail API**

## PPT Slideshow
**Video Presentation**: [Fall Presentation](https://mailuc-my.sharepoint.com/personal/narkean_mail_uc_edu/_layouts/15/stream.aspx?id=%2Fpersonal%2Fnarkean%5Fmail%5Fuc%5Fedu%2FDocuments%2FRecordings%2FSenior%20Design%2D20241027%5F172629%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2Eb3944bf8%2Daa5e%2D4673%2Db69b%2D9c1cfb42d422)

**Video Presentation Final**: [Spring Final Presentation](https://mailuc-my.sharepoint.com/:v:/g/personal/narkean_mail_uc_edu/ETG6TJ96W9JPjch_ir3y7QsBaFo04MAK6QeMOoYGCSZbQg?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=dnQSaV)



**Slide Deck**: [Fall Presentation Slides](https://mailuc-my.sharepoint.com/:p:/g/personal/prajapdh_mail_uc_edu/EauuGWDS66NBnsKtTf9hCxUBd1RkEIg86fepzMMc6UQg2g?e=3xPsEd) 

**Slide Deck Final**: [Spring Final Presentation Slides](https://mailuc-my.sharepoint.com/:p:/g/personal/narkean_mail_uc_edu/Ee1LyFghCR9Ag_EEKiVX6hMBgOKaMgOph_9LDEcZFmiA-g?e=zAxiDB)

## Final Expo Poster
[**Link to Poster**](https://github.com/solankeejalin24/CleverCollab/blob/main/CleverCollab_Expo_Poster.pdf)


## Initial Self-Assessments
1. [**Arya Narke**](https://github.com/solankeejalin24/CleverCollab/blob/main/Essays/Individual_Capstone_Assignment_narkean.pdf)
2. [**Varad Parte**](https://github.com/solankeejalin24/CleverCollab/blob/main/Essays/Individual%20Capstone%20Assignment_partevr.pdf)
3. [**Daksh Prajapati**](https://github.com/solankeejalin24/CleverCollab/blob/main/Essays/Individual_Capstone_Assignment_prajapdh.pdf)
4. [**Jalin Solankee**](https://github.com/solankeejalin24/CleverCollab/blob/main/Essays/Individual_Capstone_Assignment_solankjp.pdf)

## Final Self-Assessments
1. 
2.
3.
4.

## Summary of Hours and Justification

### Fall Semester 

| Task Description                               | Arya Narke | Varad Parte | Daksh Prajapati  | Jalin Solankee | Total Hours |
|------------------------------------------------|------------|-------------|------------------|----------------|-------------|
| Decision and Proof of Concepts                 | 6          | 6           | 6                | 6              | **24**          |
| Data Gathering, Cleansing, Preprocessing       | 4          | 4           | 4                | 10              | **22**           |
| Investigating  ML Models for Predictive Analysis | 2       | 2           | 2                | 2              | **8**           |
| Research Chatbot Interface (RovoAgent & Forge App) & Initial Development   | 4          | 4           | 10                | 4              | **22**           |
| Develop Data Pipeline from Jira                | 10      | 4           | 4                | 4              | **22**           |
| Implement ML Model for Task Prioritization     | 4          | 4           | 4                | 4              | **16**           |
| Individual Study on RAG and Query Parsing and Response Generation Modules                   | 5          | 5           | 5                | 5              | **20**           |
| Refining Chatbot using Forge App and Rovo      | 4          | 10          | 4                | 4              | **22**           |
| Documentation, Testing, Reporting and Assignments | 6       | 6           | 6                | 6              | **24**           |
| **Total Hours**                               | **45**     | **45**      | **45**           | **45**         | **180**     |

### Spring Semester

| Task Description                                                                 | Arya Narke | Varad Parte | Daksh Prajapati | Jalin Solankee | Total Hours |
|----------------------------------------------------------------------------------|------------|-------------|------------------|----------------|-------------|
| UI Development (Initial Layouts & Prototyping)                                   | 8          | 6           | 8                | 6              | **28**       |
| Setting Up Authentication System via Clerk                                       | 4          | 4           | 10                | 4              | **22**       |
| Setting Up Kanban Board with Dynamic Updates                                     | 8          | 4           | 6                | 6              | **24**       |
| Refining Data Pipeline to Populate Kanban Board                                  | 4          | 4           | 4                | 4              | **16**       |
| Migration from Python to TypeScript and Next.js                                  | 8          | 8           | 8                | 8              | **36**       |
| Refining Chatbot for Context-Awareness (Normal vs Automation Queries)            | 6          | 4           | 6                | 6              | **22**       |
| Automating Creation of New Tasks from Queries                                    | 4          | 4           | 4                | 4              | **16**       |
| UI Refinement (Color Theme, Consistency, Component Overhaul)                     | 5          | 5           | 5                | 5              | **20**       |
| Skill Matching Modal (Store & Retrieve Teammate Skills) and Query Responses      | 9          | 9           | 9                | 9              | **36**       |
| Testing, Debugging, Final Documentation and Deployment                           | 5          | 5           | 5                | 5              | **20**       |
| Expo Poster, Class Assignments, PPT, Design Report                               | 8          | 2           | 2                | 8           |**20**         |     
| **Total Hours**                                                                  | **69**     | **55**      | **67**           | **59**         | **250**      |

In addition to the development and research efforts, the team held bi-weekly meetings lasting 3–4 hours. These sessions were dedicated to discussing progress updates, addressing roadblocks, brainstorming new ideas, and sharing newly researched materials that could inform future development. 

## Summary of Expenses
Our project budget includes $15 spent on purchasing OpenAI 4o tokens, which are sufficient to meet our needs through the end of Spring 2025. Additionally, we activated a free Jira subscription with limited features, which adequately supports all the required components and scope of our project. These resources ensure cost-effective yet efficient development for our objectives.



## User Stories and Design Diagrams
### User Stories
#### User Profile - Project Manager
1. As a project manager, I want to view upcoming key tasks so that I can ensure the team meets deadlines.

2. As a project manager, I want to see which tasks are at risk of missing deadlines so that I can make adjustments proactively.

3. As a project manager, I want to assign tasks based on team members’ skills and availability so that I can optimize productivity.
   
#### User Profile - Team Member
1. As a team member, I want to view my highest-priority tasks based on importance and deadlines so that I can work on the most critical assignments first.

2. As a team member, I want to know if I can meet my deadlines based on my current progress so that I can adjust my workload if needed.

3. As a team member, I want to identify other team members with required skills for a specific task, and with some availability to help me navigate my task.

### Design Diagrams 
#### Design D0 (High-Level Overview) 

![alt text](https://github.com/solankeejalin24/CleverCollab/blob/main/Design_diagrams/D0.jpg)

#### Design D1 (Subsystem Breakdown) 

![alt text](https://github.com/solankeejalin24/CleverCollab/blob/main/Design_diagrams/D1.jpg)

#### Design D2 (Detailed Functional Breakdown) 
![alt text](https://github.com/solankeejalin24/CleverCollab/blob/main/Design_diagrams/D2.jpg)

Each diagram progressively elaborates on the system, with D2 providing a comprehensive look at the interaction between subsystems for task allocation, predictive analysis, and natural language processing.


## ABET Concerns Essay

### Economic Constraints

#### Budget and Resources
Since we are integrating technologies like machine learning models and GPT APIs, there are costs associated with API usage, cloud storage, and hosting. Our reliance on freeware or shareware might limit the scope of our project, especially when it comes to features like real-time updates or handling large datasets. If we are constrained by a limited budget, this could affect the quality and performance of the solution.

#### Funding
We are working with self-funded resources, which limits our access to premium services such as high-tier APIs or cloud infrastructure. This might impact our system's ability to handle large volumes of data efficiently.

### Professional Constraints

#### Specialized Expertise
Our project requires expertise in advanced technologies like AI, machine learning, and natural language processing. While developing the project, we are gaining valuable knowledge and experience in these areas, which contributes to our professional growth. However, gaps in our expertise might slow down progress or present challenges in implementing certain features.

### Ethical Constraints

#### Bias in AI Models
Since we are using AI and machine learning models, it is important for us to ensure that our algorithms do not introduce bias into task allocation or project predictions. If our models assign tasks unfairly, it could lead to an unbalanced workload or unequal task distribution among team members, which raises ethical concerns.

#### Transparency and Fairness
We need to ensure that our AI agents are transparent in their decision-making processes. Users should clearly understand how tasks are assigned and on what basis. If the decision-making process is opaque, it could lead to mistrust in the system, which could affect user adoption.

### Security Constraints

#### Data Privacy
Our project involves handling sensitive project management data, which means we must prioritize data security and privacy. We are responsible for ensuring that all user data is securely stored and protected from unauthorized access. Additionally, we need to ensure that any external APIs or services we use comply with security standards to avoid exposing sensitive information.

## Appendix
- [MEETING NOTES] 
- [Lang-Chain course used to learn RAG model architecture](https://github.com/bhancockio/langchain-crash-course)
- [Forge documentation](https://developer.atlassian.com/cloud/jira/platform/getting-started-with-forge/)
- [Sample template codes for programming](https://community.developer.atlassian.com/t/resources-to-get-started-building-rovo-agents-using-forge/82800)
- [Kaggle Dataset used for reference](https://www.kaggle.com/datasets/antonyjr/jira-issue-reports-v1) [Initially explored but excluded from the final project due to excessive preprocessing requirements, redundant data, and irrelevant fields beyond the project's scope.]
- [Rovo agent documentation](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/#rovo-agent--eap-)
- [Forge App Guide](https://developer.atlassian.com/platform/forge/manifest-reference/) [Did not include in final implementation due to high costs ~$120/month]
- [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction)
- [Shadcn UI components](https://ui.shadcn.com/docs)
- [Clerk Setup with Nextjs](https://clerk.com/docs/quickstarts/nextjs)
- [OpenAI API integration](https://platform.openai.com/docs/api-reference/introduction)

