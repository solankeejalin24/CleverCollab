// This file ensures that environment variables are properly accessed on the server side

export const serverEnv = {
  JIRA_BASE_URL: process.env.JIRA_BASE_URL,
  JIRA_USER: process.env.JIRA_USER,
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
  JIRA_EMAIL: process.env.JIRA_EMAIL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Log environment variables on server startup (but not the actual values for security)
console.log('Server environment variables status:', {
  JIRA_BASE_URL: serverEnv.JIRA_BASE_URL ? 'Set' : 'Not set',
  JIRA_USER: serverEnv.JIRA_USER ? 'Set' : 'Not set',
  JIRA_API_TOKEN: serverEnv.JIRA_API_TOKEN ? 'Set' : 'Not set',
  JIRA_EMAIL: serverEnv.JIRA_EMAIL ? 'Set' : 'Not set',
  OPENAI_API_KEY: serverEnv.OPENAI_API_KEY ? 'Set' : 'Not set',
}); 