import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import { serverEnv } from '@/lib/env';

export async function GET() {
  try {
    console.log('Testing Jira transitions');

    const jiraService = new JiraService();
    
    // Get the first issue
    const issues = await jiraService.getIssues('issuetype in (Story, Task, Bug)', 1);
    
    if (issues.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No issues found'
      });
    }
    
    const firstIssue = issues[0];
    console.log('First issue:', firstIssue.key);
    
    // Get transitions for the first issue
    const transitions = await jiraService.getAvailableTransitions(firstIssue.key);

    return NextResponse.json({ 
      success: true, 
      issueKey: firstIssue.key,
      transitions: transitions
    });
  } catch (error) {
    console.error('Error in Jira test transitions API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 