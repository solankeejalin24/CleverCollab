import api, { route } from '@forge/api';

// Fetch issues from jira in a specific project
export const getIssues = async (payload, requestContext) => {
  console.log(`Payload: ${JSON.stringify(payload)}`);
  console.log(`Request Context: ${JSON.stringify(requestContext)}`);

  const projectKey = payload.context.jira.projectKey;
  const label = payload.label ? payload.label : null;

  console.log(`Fetching issues for project: ${projectKey} and label: ${label}`);
  const jql = label ? `project=${projectKey} AND labels=${label}` : `project=${projectKey}`;
  const response = await api.asApp().requestJira(route`/rest/api/3/search?jql=${jql}`);
  const data = await response.json();
  const cleanData = await extractIssueDetails(data);
  return cleanData;
}

// Extract issue details from the response
export const extractIssueDetails = async (data) => {
  // console.log(`Extracting issue details from response: ${JSON.stringify(data)}`);
  return data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary
  }));
}