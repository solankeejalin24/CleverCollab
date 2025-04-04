# User Documentation and Manual

Welcome to the user documentation for **CleverCollab - Autonomous AI Agents for Project Management Automation** project. This guide will help you set up the application, configure your environment, run the system, and address frequently asked questions.

## Setting up the Application

To set up the application, ensure you have the required tools and dependencies installed. Follow the steps below to get started:

1. **Download the Project**: Start by downloading the project folder from the repository. Save the folder to your preferred location on your computer.
    - GitHub Repository Link: [Project Repository](https://github.com/your-repo-link)
  
2. **Install Dependencies**: Navigate to the project folder and install the required dependencies.
    - For Python-based dependencies, run:
      ```bash
      pip install -r requirements.txt
      ```
    - For front-end dependencies, navigate to the front-end folder and run:
      ```bash
      npm install
      ```

3. **Verify Installation**: After installation, verify that all dependencies are installed correctly by running the app. If everything is set up properly, you should see the AI system running without errors.

## Running the Application

1. **Start the Front-End**: Navigate to the front-end project folder and run the React application:
    ```bash
    npm run dev
    ```
    This will start the application in your default web browser (local host).

## Using the System

Upon logging in, you’ll be greeted with the **Dashboard**, where you can view project tasks, their status, and assigned team members.

### Key Features of Chatbot:
- **Task Prioritization**: AI agents help you prioritize your schedule and help managers to proactively predict any potential delays and bottlenecks.  
- **Skill Matching**: AI agents help you find teammates with skills that align best with your current tasks to seek efficient help.
- **Task Allocation**: AI agents automatically assign tasks based on team member skills and availability.
- **Project Insights**: View predictive insights on potential project delays and at-risk tasks.
- **Task Tracking**: Track the progress of tasks and get updates on deadlines.

#### Example Use Case: Assigning Tasks
1. From the **Dashboard**, navigate to the chatbot.
2. Ask questions like "Who should I assign Task X to depending on their availability and their skills?"

### Navigating the Dashboard

- My Prioritized Tasks: Upon login, authenticated users can view a personalized list of their prioritized tasks based on deadlines, dependencies, and workload analysis.

- Chatbot Access: Click to interact with the CleverCollab chatbot for task queries, updates, and project automation.

- Light/Dark Mode Switch: Toggle between light and dark themes for a personalized dashboard experience.

-  Button: Access helpful information and quick tips about using the dashboard features.

- Manage Skills: Opens a modal window where users can add, edit, or update team member skills. These skills are utilized by the AI for smarter task assignments and workload balancing.

- Kanban Board Access: Navigate to the Kanban board for a visual workflow management experience.

### Kanban Board Features:

- Drag and Drop: Move tasks across columns (e.g., To Do, In Progress, Done) to update their status directly in Jira in real-time.

- Hover to View Details: Hover over any task card to see the full task description without opening a separate page.

- Add New Task (Automated): Click the plus (+) button on the Kanban board to initiate the creation of a new task. Enter a task summary, and the AI will automatically refine the details (assignee, estimated hours, priority) and create the complete task in Jira.

## FAQ

**Q: What if I encounter an issue with task assignments?**  
**A:** Make sure your team members' skills and availability are updated correctly in the database. If issues persist, try refreshing the page or contact the project admin.

**Q: How does the AI system assign tasks?**  
**A:** The AI uses a combination of skills matching and availability data to allocate tasks to the most appropriate team members. It can also predict potential delays based on task dependencies and current progress.

**Q: Can I manually override task assignments?**  
**A:** Yes! If you prefer to manually assign tasks, we have given an option to edit assignee name and other fields before you hit confirmation button for any of the automation components. Additionally, you can always edit those fields in Jira.

**Q: How do I check the progress of my tasks?**  
**A:** Navigate to the **Task Dashboard** to see a real-time status of all your assigned tasks.

## Conclusion

Thank you for using **CleverCollab - Autonomous AI Agents for Project Management Automation**. We hope this documentation has provided you with the necessary guidance to get started. If you have any further questions or need additional assistance, don’t hesitate to reach out to us.

---
*This documentation was last updated on: 2/10/2025*
