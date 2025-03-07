import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jql = searchParams.get('jql') || 'issuetype in (Story)';
    const maxResults = parseInt(searchParams.get('maxResults') || '1000');

    const jiraService = new JiraService();
    const issues = await jiraService.getIssues(jql, maxResults);
    const formattedIssues = issues.map(issue => jiraService.formatIssue(issue));

    return NextResponse.json({ 
      success: true, 
      data: formattedIssues,
      total: formattedIssues.length 
    });
  } catch (error) {
    console.error('Error in Jira API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Jira issues' },
      { status: 500 }
    );
  }
} 