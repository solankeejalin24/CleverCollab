import { useState, useEffect } from 'react';
import { FormattedJiraIssue } from '@/lib/jira';

interface UseJiraReturn {
  issues: FormattedJiraIssue[];
  loading: boolean;
  error: string | null;
  fetchIssues: (jql?: string) => Promise<void>;
  getIssuesByStatus: (statusCategory: 'todo' | 'in-progress' | 'done') => FormattedJiraIssue[];
  getMyIssues: (userEmail?: string, userName?: string) => FormattedJiraIssue[];
}

export function useJira(): UseJiraReturn {
  const [issues, setIssues] = useState<FormattedJiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAccountIds, setUserAccountIds] = useState<Record<string, string>>({});

  // Effect to extract unique account IDs and their names for matching
  useEffect(() => {
    if (issues.length > 0) {
      const accountMap: Record<string, string> = {};
      
      issues.forEach(issue => {
        if (issue.assigneeAccountId && issue.assignee && issue.assignee !== 'Unassigned') {
          accountMap[issue.assigneeAccountId] = issue.assignee;
        }
      });
      
      setUserAccountIds(accountMap);
      console.log('User account mapping:', accountMap);
    }
  }, [issues]);

  const fetchIssues = async (jql = 'issuetype in (Story, Task, Bug)') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jira?jql=${encodeURIComponent(jql)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch Jira issues');
      }

      setIssues(data.data);
      console.log('Fetched issues:', data.data);
    } catch (err) {
      console.error('Error in useJira hook:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getIssuesByStatus = (statusCategory: 'todo' | 'in-progress' | 'done'): FormattedJiraIssue[] => {
    return issues.filter(issue => issue.statusCategory === statusCategory);
  };

  const getMyIssues = (userEmail?: string, userName?: string): FormattedJiraIssue[] => {
    if (!userEmail && !userName) return [];
    
    console.log('Looking for issues for user:', { userEmail, userName });
    
    // Try to match by email first
    if (userEmail) {
      const emailMatches = issues.filter(issue => 
        issue.assigneeEmail?.toLowerCase() === userEmail.toLowerCase()
      );
      
      if (emailMatches.length > 0) {
        console.log('Found issues by email match:', emailMatches.length);
        return emailMatches;
      }
    }
    
    // Try to match by name
    if (userName) {
      const nameMatches = issues.filter(issue => {
        // Case-insensitive partial name matching
        const assigneeName = issue.assignee.toLowerCase();
        const searchName = userName.toLowerCase();
        
        // Check if the assignee name contains any part of the user's name
        // or if the user's name contains any part of the assignee name
        return assigneeName.includes(searchName) || 
               searchName.includes(assigneeName);
      });
      
      if (nameMatches.length > 0) {
        console.log('Found issues by name match:', nameMatches.length);
        return nameMatches;
      }
    }
    
    // If no matches by email or name, return empty array
    console.log('No matching issues found for user');
    return [];
  };

  return {
    issues,
    loading,
    error,
    fetchIssues,
    getIssuesByStatus,
    getMyIssues,
  };
} 