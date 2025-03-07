import axios from 'axios';

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    status: { name: string };
    assignee?: { displayName: string };
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
    this.baseUrl = process.env.JIRA_BASE_URL || '';
    this.auth = {
      username: process.env.JIRA_USER || '',
      password: process.env.JIRA_API_TOKEN || '',
    };
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async getIssues(jql: string, maxResults: number = 1000): Promise<JiraIssue[]> {
    try {
      let startAt = 0;
      let allIssues: JiraIssue[] = [];

      while (true) {
        const response = await axios.get(
          `${this.baseUrl}?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&startAt=${startAt}`,
          {
            headers: this.headers,
            auth: this.auth,
          }
        );

        const issues = response.data.issues || [];
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

  formatIssue(issue: JiraIssue) {
    const fields = issue.fields;
    return {
      key: issue.key,
      issueType: fields.issuetype.name,
      summary: fields.summary,
      description: this.extractDescription(fields.description),
      status: fields.status.name,
      assignee: fields.assignee?.displayName || 'Unassigned',
      dueDate: fields.duedate,
      startDate: fields.customfield_10015,
      completedDate: fields.customfield_10062,
      estimatedHours: fields.customfield_10040,
      parent: this.extractParent(fields.parent),
    };
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
} 