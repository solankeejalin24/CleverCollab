import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import { serverEnv } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueKey = searchParams.get('issueKey');

    if (!issueKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: issueKey' },
        { status: 400 }
      );
    }

    console.log('Getting Jira issue transitions:', { 
      issueKey,
      baseUrl: serverEnv.JIRA_BASE_URL,
      user: serverEnv.JIRA_USER ? 'Set' : 'Not set',
      apiToken: serverEnv.JIRA_API_TOKEN ? 'Set' : 'Not set'
    });

    const jiraService = new JiraService();
    const transitions = await jiraService.getAvailableTransitions(issueKey);

    return NextResponse.json({ 
      success: true, 
      data: transitions
    });
  } catch (error) {
    console.error('Error in Jira transitions API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 