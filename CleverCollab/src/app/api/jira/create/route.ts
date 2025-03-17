import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Creating Jira issue with data:', body);

    const jiraService = new JiraService();
    const issue = await jiraService.createIssue({
      summary: body.summary,
      description: body.description,
      issueType: body.issueType || 'Task',
      assigneeAccountId: body.assigneeAccountId,
      estimatedHours: body.estimatedHours,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ 
      success: true, 
      data: issue,
      message: `Successfully created issue ${issue.key}`
    });
  } catch (error) {
    console.error('Error creating Jira issue:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 