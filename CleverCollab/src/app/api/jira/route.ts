import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import { serverEnv } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jql = searchParams.get('jql') || 'project is not EMPTY';
    const maxResults = parseInt(searchParams.get('maxResults') || '5000');

    console.log('Jira API request:', { 
      jql, 
      maxResults,
      baseUrl: serverEnv.JIRA_BASE_URL,
      user: serverEnv.JIRA_USER ? 'Set' : 'Not set',
      apiToken: serverEnv.JIRA_API_TOKEN ? 'Set' : 'Not set'
    });

    const jiraService = new JiraService();
    const issues = await jiraService.getIssues(jql, maxResults);
    console.log(`Retrieved ${issues.length} issues from Jira`);
    
    const formattedIssues = issues.map(issue => jiraService.formatIssue(issue));
    console.log('Sample issue:', formattedIssues.length > 0 ? {
      key: formattedIssues[0].key,
      summary: formattedIssues[0].summary,
      assignee: formattedIssues[0].assignee,
      assigneeEmail: formattedIssues[0].assigneeEmail,
      assigneeAccountId: formattedIssues[0].assigneeAccountId
    } : 'No issues found');

    return NextResponse.json({ 
      success: true, 
      data: formattedIssues,
      total: formattedIssues.length 
    });
  } catch (error) {
    console.error('Error in Jira API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 