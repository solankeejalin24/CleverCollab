import { useState } from 'react';

interface JiraIssue {
  key: string;
  issueType: string;
  summary: string;
  description: string;
  status: string;
  assignee: string;
  dueDate?: string;
  startDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  parent: string;
}

interface UseJiraReturn {
  issues: JiraIssue[];
  loading: boolean;
  error: string | null;
  fetchIssues: (jql?: string) => Promise<void>;
}

export function useJira(): UseJiraReturn {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async (jql = 'issuetype in (Story)') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jira?jql=${encodeURIComponent(jql)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch Jira issues');
      }

      setIssues(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    issues,
    loading,
    error,
    fetchIssues,
  };
} 