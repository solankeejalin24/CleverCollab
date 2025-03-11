# Project Management AI Assistant

This chatbot is a powerful AI assistant that helps with project management tasks by leveraging Jira data and team skills information. It can assist with task assignments, prioritization, workload management, and identifying project bottlenecks.

## Features

- **Skill Matching**: Find team members with specific skills for task assignments
- **Task Prioritization**: Determine task urgency based on dependencies, workload, and deadlines
- **Workload Calculation**: Analyze team members' current tasks and estimate their capacity
- **Task Allocation**: Suggest task assignments based on workload and skills
- **Bottleneck Prediction**: Identify potential delays and risks in project timelines

## Setup

1. **Environment Variables**:
   Add the following environment variables to your `.env.local` file:
   ```
   OPENAI_API_KEY=your_openai_api_key
   JIRA_BASE_URL=your_jira_base_url
   JIRA_USER=your_jira_username
   JIRA_EMAIL=your_jira_email
   JIRA_API_TOKEN=your_jira_api_token
   ```

2. **Install Dependencies**:
   ```bash
   npm install ai openai
   ```

## Usage

The chatbot can answer questions such as:

- "Who should I assign task XYZ to?"
- "Who is most experienced with my task XYZ so I can reach out to them for help?"
- "Who is likely to miss their deadline?"
- "How should I prioritize my tasks to finish everything on time?"
- "Predict potential project bottlenecks."

## Implementation Details

The chatbot is implemented using:

- **Vercel AI SDK**: For streaming AI responses and function calling
- **OpenAI GPT-4o**: For natural language understanding and generation
- **Next.js API Routes**: For handling chatbot requests
- **Custom AI Tools**: For specialized project management functions

### AI Tools

The chatbot uses several specialized tools:

1. **Skill Matcher**: Finds employees based on skills for task assignments
2. **Task Prioritizer**: Determines task urgency based on dependencies, workload, and deadlines
3. **Workload Calculator**: Analyzes an employee's current tasks and estimates their capacity
4. **Task Allocator**: Suggests task assignments based on workload and skills
5. **Project Bottleneck Predictor**: Identifies potential delays and risks in project timelines

## Architecture

The chatbot follows a modular architecture:

- **Frontend**: React components for the chat interface
- **Backend**: Next.js API routes for handling chat requests
- **AI Tools**: Specialized functions for project management tasks
- **Data Sources**: Jira API and skills dataset

## Extending the Chatbot

To add new capabilities to the chatbot:

1. Create a new tool in the `src/lib/ai-tools` directory
2. Export the tool from `src/lib/ai-tools/index.ts`
3. Add the tool to the function schema in `src/app/api/chat/route.ts`
4. Implement the function call handler in the `onFunctionCall` callback 