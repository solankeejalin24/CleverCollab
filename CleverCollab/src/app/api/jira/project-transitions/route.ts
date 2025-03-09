import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import { serverEnv } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get('projectKey') || 'PN2'; // Default to PN2 project
    const issueType = searchParams.get('issueType') || 'Story'; // Default to Story issue type
    
    console.log(`Testing transitions for ${projectKey} project, ${issueType} issue type`);

    const jiraService = new JiraService();
    
    // Get the first issue from the specified project and issue type
    const jql = `project = ${projectKey} AND issuetype = ${issueType}`;
    console.log('JQL query:', jql);
    
    const issues = await jiraService.getIssues(jql, 1);
    
    if (issues.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No ${issueType} issues found in project ${projectKey}`
      });
    }
    
    const testIssue = issues[0];
    console.log('Test issue:', {
      key: testIssue.key,
      summary: testIssue.fields.summary,
      status: testIssue.fields.status.name
    });
    
    // Get transitions for the test issue
    const transitions = await jiraService.getAvailableTransitions(testIssue.key);

    // Get the current status category
    const statusCategory = jiraService.mapStatusToCategory(testIssue.fields.status.name);
    
    // Determine target status categories
    const targetCategories = ['todo', 'in-progress', 'done'].filter(
      category => category !== statusCategory
    ) as ('todo' | 'in-progress' | 'done')[];
    
    // For each target category, find a matching transition
    const categoryTransitions = targetCategories.map(category => {
      const statusMapping: Record<string, string[]> = {
        'todo': ['To Do', 'Backlog', 'Open', 'Todo', 'New'],
        'in-progress': ['In Progress', 'In Review', 'Testing', 'Development', 'Dev', 'Working'],
        'done': ['Done', 'Closed', 'Resolved', 'Completed', 'Finish', 'Complete']
      };
      
      const targetStatusNames = statusMapping[category];
      
      // Try to find a matching transition
      const matchingTransition = transitions.find(transition => 
        targetStatusNames.some(name => 
          transition.name.toLowerCase().includes(name.toLowerCase()) ||
          (transition.to && transition.to.name && 
           transition.to.name.toLowerCase().includes(name.toLowerCase()))
        )
      );
      
      return {
        category,
        matchingTransition: matchingTransition ? {
          id: matchingTransition.id,
          name: matchingTransition.name,
          toStatus: matchingTransition.to ? matchingTransition.to.name : 'Unknown'
        } : null
      };
    });

    return NextResponse.json({ 
      success: true, 
      issue: {
        key: testIssue.key,
        summary: testIssue.fields.summary,
        status: testIssue.fields.status.name,
        statusCategory
      },
      transitions: transitions.map(t => ({
        id: t.id,
        name: t.name,
        toStatus: t.to ? t.to.name : 'Unknown'
      })),
      categoryTransitions
    });
  } catch (error) {
    console.error('Error in Jira project transitions API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 