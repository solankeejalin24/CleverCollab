import { useState, useEffect, useCallback } from 'react';
import { FormattedJiraIssue } from '@/lib/jira';
import { useUser } from '@clerk/nextjs';

interface UseJiraReturn {
  issues: FormattedJiraIssue[];
  loading: boolean;
  error: string | null;
  fetchIssues: (jql?: string) => Promise<void>;
  getIssuesByStatus: (statusCategory: 'todo' | 'in-progress' | 'done') => FormattedJiraIssue[];
  getMyIssues: (userEmail?: string, userName?: string) => FormattedJiraIssue[];
  currentUserIssues: FormattedJiraIssue[];
}

export function useJira(): UseJiraReturn {
  const [issues, setIssues] = useState<FormattedJiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAccountIds, setUserAccountIds] = useState<Record<string, string>>({});
  const [currentUserIssues, setCurrentUserIssues] = useState<FormattedJiraIssue[]>([]);
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const userName = user?.firstName || user?.lastName || user?.username;

  // Effect to extract unique account IDs and their names for matching
  useEffect(() => {
    if (issues.length > 0) {
      const accountMap: Record<string, string> = {};
      
      issues.forEach(issue => {
        if (issue.assigneeAccountId && issue.assignee && issue.assignee !== 'Unassigned') {
          accountMap[issue.assigneeAccountId] = issue.assignee;
        }
      });
      
      // Only update if the map is different to avoid unnecessary re-renders
      const currentKeys = Object.keys(userAccountIds);
      const newKeys = Object.keys(accountMap);
      
      if (currentKeys.length !== newKeys.length || 
          newKeys.some(key => !currentKeys.includes(key) || userAccountIds[key] !== accountMap[key])) {
        setUserAccountIds(accountMap);
        console.log('User account mapping updated:', accountMap);
      }
    }
  }, [issues, userAccountIds]);

  // Use useCallback to ensure the function reference is stable
  const fetchIssues = useCallback(async (jql = 'issuetype in (Story, Task, Bug)') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jira?jql=${encodeURIComponent(jql)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch Jira issues');
      }

      setIssues(data.data);
      console.log('Fetched issues:', data.data.length);
    } catch (err) {
      console.error('Error in useJira hook:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to ensure stability

  // Use useCallback for getIssuesByStatus to ensure the function reference is stable
  const getIssuesByStatus = useCallback((statusCategory: 'todo' | 'in-progress' | 'done'): FormattedJiraIssue[] => {
    return issues.filter(issue => issue.statusCategory === statusCategory);
  }, [issues]); // Only depend on issues

  // Use useCallback for getMyIssues to ensure the function reference is stable
  const getMyIssues = useCallback((userEmail?: string, userName?: string): FormattedJiraIssue[] => {
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
        if (!issue.assignee || issue.assignee === 'Unassigned') return false;
        
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
  }, [issues]); // Only depend on issues

  // Update current user's issues when issues or user changes
  useEffect(() => {
    if (issues.length > 0 && (userEmail || userName)) {
      const myIssues = getMyIssues(
        userEmail || undefined, 
        userName || undefined
      );
      setCurrentUserIssues(myIssues);
      console.log(`Found ${myIssues.length} issues for current user:`, { userEmail, userName });
    }
  }, [issues, userEmail, userName, getMyIssues]);

  return {
    issues,
    loading,
    error,
    fetchIssues,
    getIssuesByStatus,
    getMyIssues,
    currentUserIssues,
  };
} 