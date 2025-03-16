import { useState, useEffect, useCallback } from 'react';
import { FormattedJiraIssue } from '@/lib/jira';
import { useUser } from '@clerk/nextjs';
import teamMembers from '@/data/team-members.json';

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
  const fetchIssues = useCallback(async (jql = 'project is not EMPTY ORDER BY assignee') => {
    try {
      setLoading(true);
      setError(null);

      // Log the JQL query being used
      console.log('Fetching issues with JQL:', jql);

      const response = await fetch(`/api/jira?jql=${encodeURIComponent(jql)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch Jira issues');
      }

      // Log assignee information for debugging
      console.log('All issues with assignees:', data.data.map((issue: FormattedJiraIssue) => ({
        key: issue.key,
        assignee: issue.assignee,
        accountId: issue.assigneeAccountId,
        email: issue.assigneeEmail
      })));

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
      console.log('Trying email match for:', userEmail);
      const emailMatches = issues.filter(issue => 
        issue.assigneeEmail?.toLowerCase() === userEmail.toLowerCase()
      );
      
      if (emailMatches.length > 0) {
        console.log('Found issues by email match:', emailMatches.length);
        return emailMatches;
      }
    }
    
    // Try to find the team member by name
    if (userName) {
      const searchName = userName.toLowerCase();
      console.log('Looking for team member with name:', searchName);
      
      const teamMember = teamMembers.members.find(member => {
        const isMatch = member.name.toLowerCase() === searchName ||
          member.shortNames.some(shortName => shortName.toLowerCase() === searchName);
        if (isMatch) {
          console.log('Found team member:', member);
        }
        return isMatch;
      });

      if (teamMember) {
        console.log('Found team member, searching by account ID:', teamMember.accountId);
        const accountMatches = issues.filter(issue => {
          const isMatch = issue.assigneeAccountId === teamMember.accountId;
          if (isMatch) {
            console.log('Found matching issue:', issue.key);
          }
          return isMatch;
        });
        
        if (accountMatches.length > 0) {
          console.log('Found issues by account ID match:', accountMatches.length);
          return accountMatches;
        } else {
          console.log('No issues found for account ID:', teamMember.accountId);
        }
      } else {
        console.log('No team member found with name:', searchName);
      }

      // Fallback to name matching if no account ID match
      console.log('Trying fallback name matching');
      const nameMatches = issues.filter(issue => {
        if (!issue.assignee || issue.assignee === 'Unassigned') return false;
        
        const assigneeName = issue.assignee.toLowerCase();
        const isMatch = assigneeName.includes(searchName) || searchName.includes(assigneeName);
        if (isMatch) {
          console.log('Found name match:', issue.key, issue.assignee);
        }
        return isMatch;
      });
      
      if (nameMatches.length > 0) {
        console.log('Found issues by name match:', nameMatches.length);
        return nameMatches;
      }
    }
    
    console.log('No matching issues found for user');
    return [];
  }, [issues]);

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