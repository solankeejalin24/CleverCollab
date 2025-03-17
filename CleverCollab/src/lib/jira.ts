import axios from 'axios';
import { serverEnv } from './env';

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    status: { name: string };
    assignee?: { 
      displayName: string; 
      emailAddress?: string;
      accountId?: string;
    };
    duedate?: string;
    customfield_10015?: string; // Start Date
    customfield_10062?: string; // Completed Date
    customfield_10040?: number; // Estimated Hours
    description?: any;
    parent?: {
      key: string;
      fields: {
        summary: string;
      };
    };
  };
}

export interface FormattedJiraIssue {
  id: string;
  key: string;
  issueType: string;
  summary: string;
  description: string;
  status: string;
  statusCategory: 'todo' | 'in-progress' | 'done';
  assignee: string;
  assigneeEmail?: string;
  assigneeAccountId?: string;
  dueDate?: string;
  startDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  parent: string;
}

export class JiraService {
  private baseUrl: string;
  private auth: {
    username: string;
    password: string;
  };
  private headers: {
    Accept: string;
    'Content-Type': string;
  };

  constructor() {
    this.baseUrl = serverEnv.JIRA_BASE_URL || '';
    this.auth = {
      username: serverEnv.JIRA_USER || '',
      password: serverEnv.JIRA_API_TOKEN || '',
    };
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    
    console.log('JiraService initialized with:', {
      baseUrl: this.baseUrl ? 'Set' : 'Not set',
      username: this.auth.username ? 'Set' : 'Not set',
      password: this.auth.password ? 'Set' : 'Not set',
    });
  }

  async getIssues(jql: string, maxResults: number = 1000): Promise<JiraIssue[]> {
    try {
      let startAt = 0;
      let allIssues: JiraIssue[] = [];

      // Ensure baseUrl is properly formatted
      let baseUrl = this.baseUrl.trim();
      console.log('Using Jira base URL:', baseUrl);
      
      if (!baseUrl) {
        throw new Error('Jira base URL is not configured');
      }

      // Handle API version differences (v2 vs v3)
      if (baseUrl.includes('/rest/api/3/')) {
        console.log('Detected API v3, continuing with current URL');
      } else if (!baseUrl.includes('/rest/api/')) {
        // If no API version is specified, default to v2
        baseUrl = `${baseUrl.replace(/\/$/, '')}/rest/api/2/search`;
        console.log('No API version detected, defaulting to:', baseUrl);
      }

      while (true) {
        const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&startAt=${startAt}`;
        console.log('Fetching Jira issues from URL:', url);
        
        const response = await axios.get(url, {
          headers: this.headers,
          auth: this.auth,
        });

        const issues = response.data.issues || [];
        console.log(`Retrieved ${issues.length} issues from Jira`);
        
        allIssues = [...allIssues, ...issues];

        if (issues.length < maxResults) {
          break;
        }

        startAt += maxResults;
      }

      return allIssues;
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      throw error;
    }
  }

  formatIssue(issue: JiraIssue): FormattedJiraIssue {
    const fields = issue.fields;
    const statusCategory = this.mapStatusToCategory(fields.status.name);
    
    return {
      id: issue.key, // Using the key as the ID for drag-and-drop
      key: issue.key,
      issueType: fields.issuetype.name,
      summary: fields.summary,
      description: this.extractDescription(fields.description),
      status: fields.status.name,
      statusCategory,
      assignee: fields.assignee?.displayName || 'Unassigned',
      assigneeEmail: fields.assignee?.emailAddress,
      assigneeAccountId: fields.assignee?.accountId,
      dueDate: fields.duedate,
      startDate: fields.customfield_10015,
      completedDate: fields.customfield_10062,
      estimatedHours: fields.customfield_10040,
      parent: this.extractParent(fields.parent),
    };
  }

  // Make this method public so it can be used by the API
  public mapStatusToCategory(status: string): 'todo' | 'in-progress' | 'done' {
    // Map Jira statuses to Kanban columns
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('to do') || lowerStatus.includes('backlog') || lowerStatus.includes('open') || 
        lowerStatus.includes('todo') || lowerStatus.includes('new')) {
      return 'todo';
    } else if (lowerStatus.includes('in progress') || lowerStatus.includes('review') || 
               lowerStatus.includes('testing') || lowerStatus.includes('develop') || 
               lowerStatus.includes('working')) {
      return 'in-progress';
    } else if (lowerStatus.includes('done') || lowerStatus.includes('closed') || 
               lowerStatus.includes('resolved') || lowerStatus.includes('completed') || 
               lowerStatus.includes('finish')) {
      return 'done';
    }
    
    // Default to todo for unknown statuses
    return 'todo';
  }

  private extractDescription(description: any): string {
    if (!description || !description.content) return '';

    const extractText = (content: any[]): string => {
      return content
        .map((item) => {
          if (item.type === 'text') return item.text;
          if (item.content) return extractText(item.content);
          return '';
        })
        .join('');
    };

    return description.content
      .map((block: any) => extractText(block.content || []))
      .filter(Boolean)
      .join('\n');
  }

  private extractParent(parent?: JiraIssue['fields']['parent']): string {
    if (!parent) return 'No Parent';
    return `${parent.key} - ${parent.fields.summary}`;
  }

  // Add a method to update issue status
  async updateIssueStatus(issueKey: string, statusCategory: 'todo' | 'in-progress' | 'done'): Promise<boolean> {
    try {
      // Get available transitions
      const transitions = await this.getAvailableTransitions(issueKey);
      console.log(`Available transitions for ${issueKey}:`, transitions.map(t => `${t.name} (${t.id})`));
      
      if (transitions.length === 0) {
        throw new Error(`No transitions available for issue ${issueKey}`);
      }
      
      // For Kanban projects, we need a different approach
      // Let's try to find a transition based on the target category
      let matchingTransition = null;
      
      if (statusCategory === 'todo') {
        // For "todo", look for transitions that might move backward
        matchingTransition = transitions.find(t => 
          t.name.toLowerCase().includes('backlog') || 
          t.name.toLowerCase().includes('open') ||
          t.name.toLowerCase().includes('todo') ||
          t.name.toLowerCase().includes('to do')
        );
      } else if (statusCategory === 'in-progress') {
        // For "in-progress", look for transitions that start work
        matchingTransition = transitions.find(t => 
          t.name.toLowerCase().includes('progress') || 
          t.name.toLowerCase().includes('start') ||
          t.name.toLowerCase().includes('develop') ||
          t.name.toLowerCase().includes('working')
        );
      } else if (statusCategory === 'done') {
        // For "done", look for transitions that complete work
        matchingTransition = transitions.find(t => 
          t.name.toLowerCase().includes('done') || 
          t.name.toLowerCase().includes('complete') ||
          t.name.toLowerCase().includes('finish') ||
          t.name.toLowerCase().includes('close') ||
          t.name.toLowerCase().includes('resolve')
        );
      }
      
      // If no match found, just use the first transition
      if (!matchingTransition && transitions.length > 0) {
        console.log('No specific matching transition found, using first available transition');
        matchingTransition = transitions[0];
      }

      if (!matchingTransition) {
        throw new Error(`No matching transition found for status category: ${statusCategory}`);
      }

      console.log(`Selected transition for ${issueKey}: ${matchingTransition.name} (ID: ${matchingTransition.id})`);

      // Get the base URL without the search endpoint
      let baseUrl = this.baseUrl.trim();
      const apiBase = baseUrl.includes('/search') 
        ? baseUrl.substring(0, baseUrl.lastIndexOf('/search'))
        : baseUrl;

      // Construct the transition URL
      const url = `${apiBase}/issue/${issueKey}/transitions`;
      
      console.log('Transition URL:', url);

      // Make the API call to update the issue
      const response = await axios.post(
        url,
        {
          transition: {
            id: matchingTransition.id
          }
        },
        {
          headers: this.headers,
          auth: this.auth,
        }
      );

      console.log(`Issue ${issueKey} updated successfully to ${matchingTransition.name}`);
      return true;
    } catch (error) {
      console.error(`Error updating issue ${issueKey}:`, error);
      throw error;
    }
  }

  // Get available transitions for an issue
  async getAvailableTransitions(issueKey: string): Promise<any[]> {
    try {
      // Get the base URL without the search endpoint
      let baseUrl = this.baseUrl.trim();
      const apiBase = baseUrl.includes('/search') 
        ? baseUrl.substring(0, baseUrl.lastIndexOf('/search'))
        : baseUrl;

      // Construct the transition URL
      const url = `${apiBase}/issue/${issueKey}/transitions?expand=transitions.fields`;
      
      console.log('Getting available transitions from URL:', url);

      // Make the API call to get available transitions
      const response = await axios.get(
        url,
        {
          headers: this.headers,
          auth: this.auth,
        }
      );

      const transitions = response.data.transitions || [];
      
      // Log detailed information about each transition
      transitions.forEach((transition: any) => {
        console.log(`Transition: ${transition.name} (ID: ${transition.id})`);
        if (transition.to) {
          console.log(`  → To Status: ${transition.to.name} (ID: ${transition.to.id})`);
        }
      });
      
      return transitions;
    } catch (error) {
      console.error(`Error getting transitions for issue ${issueKey}:`, error);
      throw error;
    }
  }

  // Get project metadata
  async getProjectMetadata(projectKey: string): Promise<any> {
    try {
      // Get the base URL without the search endpoint
      let baseUrl = this.baseUrl.trim();
      const apiBase = baseUrl.includes('/search') 
        ? baseUrl.substring(0, baseUrl.lastIndexOf('/search'))
        : baseUrl;

      // Construct the project URL
      const url = `${apiBase}/project/${projectKey}`;
      
      console.log('Getting project metadata from URL:', url);

      // Make the API call to get project metadata
      const response = await axios.get(
        url,
        {
          headers: this.headers,
          auth: this.auth,
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error getting metadata for project ${projectKey}:`, error);
      throw error;
    }
  }

  // Method to assign an issue to a user
  async assignIssue(issueKey: string, assigneeIdOrEmail: string): Promise<void> {
    try {
      console.log(`[JiraService] Assigning issue ${issueKey} to ${assigneeIdOrEmail}`);
      
      // Determine if the input is an email or an account ID
      const isEmail = assigneeIdOrEmail.includes('@');
      
      // Construct the base URL without /search if present
      const apiBase = this.baseUrl.replace(/\/search$/, '');
      const url = `${apiBase}/issue/${issueKey}/assignee`;
      
      console.log(`[JiraService] Using URL: ${url}`);
      
      // Prepare the request body based on whether we have an email or account ID
      const requestBody = isEmail 
        ? { emailAddress: assigneeIdOrEmail } 
        : { accountId: assigneeIdOrEmail };
      
      console.log(`[JiraService] Request body: ${JSON.stringify(requestBody)}`);
      console.log(`[JiraService] Headers:`, this.headers);
      console.log(`[JiraService] Auth:`, { username: this.auth.username, password: '***' });
      
      try {
        const response = await axios.put(url, requestBody, {
          headers: this.headers,
          auth: this.auth
        });
        
        // Check if the response is successful (204 No Content or 200 OK)
        if (response.status !== 204 && response.status !== 200) {
          console.error(`[JiraService] Failed to assign issue: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to assign issue: ${response.status} ${response.statusText}`);
        }
        
        console.log(`[JiraService] Successfully assigned issue ${issueKey} to ${assigneeIdOrEmail}`);
        console.log(`[JiraService] Response status: ${response.status}`);
        return;
      } catch (axiosError: any) {
        console.error(`[JiraService] Axios error:`, axiosError);
        if (axiosError.response) {
          console.error(`[JiraService] Response status: ${axiosError.response.status}`);
          console.error(`[JiraService] Response data:`, axiosError.response.data);
        }
        throw axiosError;
      }
    } catch (error: any) {
      console.error(`[JiraService] Error assigning issue ${issueKey} to ${assigneeIdOrEmail}:`, error);
      throw new Error(`Failed to assign issue: ${error.message}`);
    }
  }
} 