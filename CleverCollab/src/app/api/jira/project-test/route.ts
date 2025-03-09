import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get('projectKey') || 'PN2';
    const issueType = searchParams.get('issueType') || 'Story';
    
    console.log(`Testing project ${projectKey}, issue type ${issueType}`);

    const jiraService = new JiraService();
    
    // Get issues from the specified project
    const jql = `project = ${projectKey} AND issuetype = ${issueType}`;
    const issues = await jiraService.getIssues(jql, 1);
    
    if (issues.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No issues found for project ${projectKey} and type ${issueType}`
      });
    }
    
    const testIssue = issues[0];
    
    // Get transitions for the test issue
    const transitions = await jiraService.getAvailableTransitions(testIssue.key);

    return NextResponse.json({ 
      success: true, 
      issue: {
        key: testIssue.key,
        summary: testIssue.fields.summary,
        status: testIssue.fields.status.name
      },
      transitions: transitions.map(t => ({
        id: t.id,
        name: t.name,
        toStatus: t.to ? t.to.name : 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Error in project test API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 