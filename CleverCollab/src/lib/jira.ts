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

  // Helper methods for debugging and testing
  getApiBase(): string {
    return this.baseUrl.replace(/\/search$/, '');
  }

  getHeaders(): any {
    return { ...this.headers };
  }

  getAuth(): any {
    return { ...this.auth };
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
      
      // Check if it's a Jira Cloud account ID (looks like 712020:f15989c0-31c3-4d67-9f58-4195acb97ddc)
      const isJiraCloudId = /^\d+:[a-f0-9-]+$/i.test(assigneeIdOrEmail);
      // Check if it's a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-f]{24}$/i.test(assigneeIdOrEmail);
      // Determine if the input is an email
      const isEmail = assigneeIdOrEmail.includes('@');
      
      // Log the detected format
      if (isJiraCloudId) {
        console.log(`[JiraService] Detected Jira Cloud account ID format`);
      } else if (isMongoId) {
        console.log(`[JiraService] Detected MongoDB ID format`);
      } else if (isEmail) {
        console.log(`[JiraService] Detected email format`);
      } else {
        console.log(`[JiraService] Unknown ID format, will try multiple formats`);
      }
      
      // Construct the base URL without /search if present
      const apiBase = this.baseUrl.replace(/\/search$/, '');
      const url = `${apiBase}/issue/${issueKey}/assignee`;
      
      console.log(`[JiraService] Using URL: ${url}`);
      
      // Jira Cloud requires a specific format for the accountId parameter
      if (isJiraCloudId) {
        try {
          // For Jira Cloud, accountId is the preferred format
          console.log(`[JiraService] Using Jira Cloud accountId format`);
          
          const response = await axios.put(url, { accountId: assigneeIdOrEmail }, {
            headers: this.headers,
            auth: this.auth
          });
          
          if (response.status === 204 || response.status === 200) {
            console.log(`[JiraService] Successfully assigned issue using Jira Cloud format`);
            return;
          }
        } catch (error: any) {
          console.error(`[JiraService] Error with Jira Cloud format:`, error.message);
          // Continue to try other formats
        }
      }
      
      // Try each format in sequence, starting with the most appropriate based on the ID type
      let formats = [];
      
      if (isEmail) {
        // If it's an email, prioritize email formats
        formats = [
          { emailAddress: assigneeIdOrEmail },
          { accountId: assigneeIdOrEmail },
          { name: assigneeIdOrEmail },
          { value: assigneeIdOrEmail },
          assigneeIdOrEmail
        ];
      } else if (isMongoId) {
        // If it's a MongoDB ID, prioritize ID formats
        formats = [
          { accountId: assigneeIdOrEmail },
          { id: assigneeIdOrEmail },
          { key: assigneeIdOrEmail },
          { name: assigneeIdOrEmail },
          assigneeIdOrEmail
        ];
      } else {
        // General formats to try
        formats = [
          { accountId: assigneeIdOrEmail },
          { name: assigneeIdOrEmail },
          { key: assigneeIdOrEmail },
          { id: assigneeIdOrEmail },
          assigneeIdOrEmail,
          { value: assigneeIdOrEmail },
          { "account-id": assigneeIdOrEmail },
          { value: { accountId: assigneeIdOrEmail } }
        ];
      }
      
      // Try an extra format for Jira Cloud when using an email
      if (isEmail) {
        console.log(`[JiraService] Searching for user by email: ${assigneeIdOrEmail}`);
        // First try to find the user by email to get their account ID
        try {
          const userSearchUrl = `${apiBase}/user/search?query=${encodeURIComponent(assigneeIdOrEmail)}`;
          const userResponse = await axios.get(userSearchUrl, {
            headers: this.headers,
            auth: this.auth
          });
          
          if (userResponse.data && userResponse.data.length > 0) {
            const foundUser = userResponse.data[0];
            console.log(`[JiraService] Found user:`, foundUser);
            
            if (foundUser.accountId) {
              console.log(`[JiraService] Using found accountId: ${foundUser.accountId}`);
              
              // Try with the found accountId
              const assignResponse = await axios.put(url, { accountId: foundUser.accountId }, {
                headers: this.headers,
                auth: this.auth
              });
              
              if (assignResponse.status === 204 || assignResponse.status === 200) {
                console.log(`[JiraService] Successfully assigned issue using found accountId`);
                return;
              }
            }
          }
        } catch (error: any) {
          console.error(`[JiraService] Error finding user by email:`, error.message);
          // Continue to try other formats
        }
      }
      
      // Log what formats we'll be trying
      console.log(`[JiraService] Will try ${formats.length} different assignee formats`);
      
      let lastError = null;
      
      // Try each format
      for (const format of formats) {
        try {
          console.log(`[JiraService] Trying assignee format:`, format);
          
          const response = await axios.put(url, format, {
            headers: this.headers,
            auth: this.auth
          });
          
          // Check if the response is successful (204 No Content or 200 OK)
          if (response.status === 204 || response.status === 200) {
            console.log(`[JiraService] Successfully assigned issue ${issueKey} using format:`, format);
            console.log(`[JiraService] Response status: ${response.status}`);
            return;
          }
          
          console.log(`[JiraService] Unexpected response status: ${response.status} ${response.statusText}`);
        } catch (axiosError: any) {
          console.log(`[JiraService] Failed with assignee format:`, format);
          if (axiosError.response) {
            console.error(`[JiraService] Response status: ${axiosError.response.status}`);
            console.error(`[JiraService] Response data:`, axiosError.response.data);
          } else {
            console.error(`[JiraService] Error without response:`, axiosError.message);
          }
          lastError = axiosError;
        }
      }
      
      // Try with an empty assignee to clear the field (sometimes helps diagnose issues)
      try {
        console.log(`[JiraService] Trying to clear assignee as a test`);
        const response = await axios.put(url, null, {
          headers: this.headers,
          auth: this.auth
        });
        
        if (response.status === 204 || response.status === 200) {
          console.log(`[JiraService] Successfully cleared assignee, now trying to set it again`);
          
          // If clearing worked, try setting again with accountId format
          const assignResponse = await axios.put(url, { accountId: assigneeIdOrEmail }, {
            headers: this.headers,
            auth: this.auth
          });
          
          if (assignResponse.status === 204 || assignResponse.status === 200) {
            console.log(`[JiraService] Successfully assigned issue after clearing`);
            return;
          }
        }
      } catch (error: any) {
        console.error(`[JiraService] Error clearing assignee:`, error.message);
      }
      
      // If we get here, all formats failed
      console.error(`[JiraService] All assignee formats failed for ${issueKey} to ${assigneeIdOrEmail}`);
      console.error(`[JiraService] Last error:`, lastError);
      throw new Error(`Failed to assign issue: All formats failed. Last error: ${lastError?.message || 'Unknown error'}`);
    } catch (error: any) {
      console.error(`[JiraService] Error assigning issue ${issueKey} to ${assigneeIdOrEmail}:`, error);
      throw new Error(`Failed to assign issue: ${error.message}`);
    }
  }

  // Method to create a new issue
  async createIssue(issueData: {
    summary: string;
    description: string;
    issueType: string;
    projectKey: string;
    startDate?: string;
    dueDate?: string;
    assignee?: string;
    estimatedHours?: number;
  }): Promise<any> {
    try {
      console.log(`[JiraService] Creating issue with data:`, issueData);
      
      const apiBase = this.baseUrl.replace(/\/search$/, '');
      const url = `${apiBase}/issue`;
      
      console.log(`[JiraService] Using URL: ${url}`);
      
      // Check if we're using API v3 (which requires different description format)
      const isApiV3 = this.baseUrl.includes('/rest/api/3/');
      
      // Prepare request body
      const requestBody: any = {
        fields: {
          summary: issueData.summary,
          issuetype: {
            name: issueData.issueType
          },
          project: {
            key: issueData.projectKey
          }
        }
      };
      
      // Format description based on API version
      if (isApiV3) {
        // API v3 uses Atlassian Document Format
        requestBody.fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: issueData.description
                }
              ]
            }
          ]
        };
      } else {
        // API v2 uses plain text
        requestBody.fields.description = issueData.description;
      }
      
      // Add optional start date
      if (issueData.startDate) {
        console.log(`[JiraService] Setting start date: ${issueData.startDate}`);
        requestBody.fields.customfield_10015 = issueData.startDate;
      }
      
      // Add optional due date
      if (issueData.dueDate) {
        console.log(`[JiraService] Setting due date: ${issueData.dueDate}`);
        requestBody.fields.duedate = issueData.dueDate;
      }
      
      // Add optional estimated hours
      if (issueData.estimatedHours !== undefined) {
        let estimatedHoursValue = issueData.estimatedHours;
        
        // Convert to number if it's a string
        if (typeof estimatedHoursValue === 'string') {
          estimatedHoursValue = parseFloat(estimatedHoursValue);
          console.log(`[JiraService] Parsed estimatedHours from string to number: ${estimatedHoursValue}`);
        }
        
        if (!isNaN(estimatedHoursValue)) {
          console.log(`[JiraService] Setting estimated hours: ${estimatedHoursValue}`);
          requestBody.fields.customfield_10040 = estimatedHoursValue;
        } else {
          console.warn(`[JiraService] Invalid estimated hours value: ${issueData.estimatedHours}, not setting field`);
        }
      }
      
      console.log(`[JiraService] Request body:`, JSON.stringify(requestBody, null, 2));
      
      try {
        // Simple, direct request without assignee
        const response = await axios.post(url, requestBody, {
          headers: this.headers,
          auth: this.auth
        });
        
        console.log(`[JiraService] Successfully created issue:`, response.data);
        
        // If we have assignee data, try to assign the issue in a separate request
        if (issueData.assignee && response.data && response.data.key) {
          const issueKey = response.data.key;
          try {
            console.log(`[JiraService] Attempting to assign issue ${issueKey} to ${issueData.assignee}`);
            await this.assignIssue(issueKey, issueData.assignee);
            console.log(`[JiraService] Successfully assigned issue ${issueKey} to ${issueData.assignee}`);
          } catch (assignError) {
            console.error(`[JiraService] Failed to assign issue ${issueKey}:`, assignError);
            // Continue with the unassigned issue
          }
        }
        
        return response.data;
      } catch (error: any) {
        console.error(`[JiraService] Error creating issue:`, error.message);
        
        if (error.response) {
          console.error(`[JiraService] Response status: ${error.response.status}`);
          console.error(`[JiraService] Response data:`, error.response.data);
          
          // Check for specific error cases and try to fix
          if (error.response.status === 400) {
            const errorData = error.response.data;
            
            // Try to identify the specific error and fix it
            if (errorData.errors) {
              console.log(`[JiraService] Validation errors:`, errorData.errors);
              
              // If description format is the issue, try the opposite format
              if (errorData.errors.description) {
                console.log(`[JiraService] Description format error, trying alternate format`);
                
                // Toggle the description format
                if (isApiV3) {
                  // If we tried ADF, try plain text
                  requestBody.fields.description = issueData.description;
                } else {
                  // If we tried plain text, try ADF
                  requestBody.fields.description = {
                    type: "doc",
                    version: 1,
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: issueData.description
                          }
                        ]
                      }
                    ]
                  };
                }
                
                console.log(`[JiraService] Retrying with alternate description format:`, requestBody.fields.description);
                
                // Try again
                try {
                  const retryResponse = await axios.post(url, requestBody, {
                    headers: this.headers,
                    auth: this.auth
                  });
                  
                  console.log(`[JiraService] Successfully created issue with alternate description format:`, retryResponse.data);
                  return retryResponse.data;
                } catch (retryError: any) {
                  console.error(`[JiraService] Retry also failed:`, retryError.message);
                  throw retryError;
                }
              }
              
              // If estimated hours is the issue, remove it and retry
              if (errorData.errors.customfield_10040) {
                console.log(`[JiraService] Estimated hours format error, removing field and retrying`);
                
                // Remove the problematic field
                delete requestBody.fields.customfield_10040;
                
                // Try again
                try {
                  const retryResponse = await axios.post(url, requestBody, {
                    headers: this.headers,
                    auth: this.auth
                  });
                  
                  console.log(`[JiraService] Successfully created issue without estimated hours:`, retryResponse.data);
                  return retryResponse.data;
                } catch (retryError: any) {
                  console.error(`[JiraService] Retry also failed:`, retryError.message);
                  throw retryError;
                }
              }
            }
          }
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error(`[JiraService] Error creating issue:`, error);
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }
} 