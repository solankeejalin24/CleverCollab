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

## Setting up the Database with Convex

Before you can run the application, you'll need to set up the **Convex** database. Follow these steps to prepare your database:

## Running the Application

You have two options for running the application: running just the backend (AI Agents), or running both the front-end and backend for a full application experience. Follow the instructions below for each method:

### Running the Front-End Application

1. **Start the Front-End**: Navigate to the front-end project folder and run the React application:
    ```bash
    npm start
    ```
    This will start the front-end application in your default web browser.

### Running the Full Application (Front-End + Backend)

1. **Start the Full Application**: Navigate to the backend project folder and run:
    ```bash
    python app.py
    ```
    This will start the backend AI system along with the front-end interface.

Please wait a few moments for both the backend and front-end applications to start. Once the front-end loads in your browser, you will be able to interact with the AI agents.

## Using the System

Upon logging in, you’ll be greeted with the **Dashboard**, where you can view project tasks, their status, and assigned team members.

### Key Features:
- **Task Prioritization**: AI agents help you prioritize your schedule and help managers to proactively predict any potential delays and bottlenecks.  
- **Skill Matching**: AI agents help you find teammates with skills that align best with your current tasks to seek efficient help.
- **Task Allocation**: AI agents automatically assign tasks based on team member skills and availability.
- **Project Insights**: View predictive insights on potential project delays and at-risk tasks.
- **Task Tracking**: Track the progress of tasks and get updates on deadlines.

#### Example Use Case: Assigning Tasks
1. From the **Dashboard**, navigate to the chatbot.
2. Ask questions like "Who should I assign Task X to depending on their availability and their skills?"

### Navigating the Dashboard

- **View Tasks**: A detailed list of tasks with current statuses (e.g., In Progress, Completed).
- **Filter Tasks**: Use filters to view high-priority tasks or tasks at risk.
- **Update Progress**: Update task progress by clicking on the task card and entering completion details.

## FAQ

**Q: What if I encounter an issue with task assignments?**  
**A:** Make sure your team members' skills and availability are updated correctly in the database. If issues persist, try refreshing the page or contact the project admin.

**Q: How does the AI system assign tasks?**  
**A:** The AI uses a combination of skills matching and availability data to allocate tasks to the most appropriate team members. It can also predict potential delays based on task dependencies and current progress.

**Q: Can I manually override task assignments?**  
**A:** Yes! If you prefer to manually assign tasks, you can disable the AI's automatic assignment feature from the settings.

**Q: How do I check the progress of my tasks?**  
**A:** Navigate to the **Task Dashboard** to see a real-time status of all your assigned tasks.

## Conclusion

Thank you for using **CleverCollab - Autonomous AI Agents for Project Management Automation**. We hope this documentation has provided you with the necessary guidance to get started. If you have any further questions or need additional assistance, don’t hesitate to reach out to us.

---
*This documentation was last updated on: 2/10/2025*
