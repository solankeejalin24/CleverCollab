import { NextResponse } from 'next/server';
import { updateJiraIssueStatus } from '@/lib/jira-kanban';
import { serverEnv } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issueKey, statusCategory } = body;

    if (!issueKey || !statusCategory) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: issueKey or statusCategory' },
        { status: 400 }
      );
    }

    console.log('Updating Jira issue status:', { 
      issueKey, 
      statusCategory,
      baseUrl: serverEnv.JIRA_BASE_URL,
      user: serverEnv.JIRA_USER ? 'Set' : 'Not set',
      apiToken: serverEnv.JIRA_API_TOKEN ? 'Set' : 'Not set'
    });

    await updateJiraIssueStatus(issueKey, statusCategory);

    return NextResponse.json({ 
      success: true, 
      message: `Issue ${issueKey} updated to ${statusCategory} successfully`
    });
  } catch (error) {
    console.error('Error in Jira update status API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 