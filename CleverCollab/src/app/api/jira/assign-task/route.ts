import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import fs from 'fs';
import path from 'path';

// Interface for team member
interface TeamMember {
  id: string;
  name: string;
  email: string;
}

// Function to load team members data
async function loadTeamMembers(): Promise<TeamMember[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'team_members.json');
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      console.log('Team members file not found');
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading team members:', error);
    return [];
  }
}

// Function to find team member by name
function findTeamMemberByName(teamMembers: TeamMember[], name: string): TeamMember | undefined {
  const normalizedName = name.toLowerCase();
  return teamMembers.find(member => 
    member.name.toLowerCase().includes(normalizedName) || 
    normalizedName.includes(member.name.toLowerCase())
  );
}

// GET endpoint for checking assignment status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskKey = searchParams.get('taskKey');
    const assignee = searchParams.get('assignee');

    if (!taskKey || !assignee) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters: taskKey and assignee',
          details: {
            taskKey: taskKey ? 'provided' : 'missing',
            assignee: assignee ? 'provided' : 'missing'
          }
        },
        { status: 400 }
      );
    }

    const jiraService = new JiraService();
    const issues = await jiraService.getIssues(`key = ${taskKey}`, 1);
    
    return NextResponse.json({
      success: true,
      data: {
        taskKey,
        currentAssignee: issues[0]?.fields.assignee?.emailAddress || 'unassigned',
        proposedAssignee: assignee
      }
    });
  } catch (error: any) {
    console.error('Error in assign-task GET route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// POST endpoint for actually performing the assignment
export async function POST(request: Request) {
  try {
    console.log('[Assign Task API] POST request received');
    
    const body = await request.json();
    const { taskKey, assignee } = body;

    console.log(`[Assign Task API] Request body: taskKey=${taskKey}, assignee=${assignee}`);

    if (!taskKey || !assignee) {
      console.log('[Assign Task API] Missing required parameters');
      
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters in request body',
          details: {
            taskKey: taskKey ? 'provided' : 'missing',
            assignee: assignee ? 'provided' : 'missing'
          }
        },
        { 
          status: 400,
          headers: {
            'X-Show-Toast': JSON.stringify({
              type: 'error',
              message: 'Missing required parameters for task assignment'
            })
          }
        }
      );
    }

    console.log(`[Assign Task API] Attempting to assign task ${taskKey} to ${assignee}`);
    
    // Determine if assignee is an ID, email, or name
    let assigneeId = assignee;
    
    // Check if it's a MongoDB ObjectId (24 hex characters)
    const isMongoId = /^[0-9a-f]{24}$/i.test(assignee);
    
    // If it's not an ID format (no @ for email and not UUID format), try to find by name
    if (!assignee.includes('@') && !assignee.includes(':') && !isMongoId) {
      console.log(`[Assign Task API] Assignee "${assignee}" appears to be a name, looking up ID`);
      
      const teamMembers = await loadTeamMembers();
      console.log(`[Assign Task API] Loaded ${teamMembers.length} team members`);
      console.log('[Assign Task API] Available team members:', teamMembers.map(m => ({ id: m.id, name: m.name })));
      
      const teamMember = findTeamMemberByName(teamMembers, assignee);
      
      if (teamMember) {
        assigneeId = teamMember.id;
        console.log(`[Assign Task API] Found team member ID for ${assignee}: ${assigneeId}`);
      } else {
        console.warn(`[Assign Task API] Could not find team member ID for ${assignee}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Could not find team member ID',
            details: {
              assignee,
              availableMembers: teamMembers.map(m => m.name)
            }
          },
          { 
            status: 404,
            headers: {
              'X-Show-Toast': JSON.stringify({
                type: 'error',
                message: `Could not find team member ID for ${assignee}`
              })
            }
          }
        );
      }
    } else if (isMongoId) {
      console.log(`[Assign Task API] Assignee "${assignee}" appears to be a MongoDB ID`);
      
      // Verify the ID exists in team_members.json
      const teamMembers = await loadTeamMembers();
      const teamMember = teamMembers.find(m => m.id === assignee);
      
      if (teamMember) {
        console.log(`[Assign Task API] Verified team member ID ${assignee} belongs to ${teamMember.name}`);
      } else {
        console.warn(`[Assign Task API] Could not verify team member ID ${assignee}`);
        // Continue anyway, as the ID might be valid in Jira even if not in our local data
      }
    } else if (assignee.includes('@')) {
      console.log(`[Assign Task API] Assignee "${assignee}" appears to be an email address`);
    } else {
      console.log(`[Assign Task API] Assignee "${assignee}" appears to be an account ID`);
    }

    console.log(`[Assign Task API] Creating Jira service instance`);
    const jiraService = new JiraService();

    try {
      console.log(`[Assign Task API] Calling jiraService.assignIssue(${taskKey}, ${assigneeId})`);
      await jiraService.assignIssue(taskKey, assigneeId);
      console.log(`[Assign Task API] Successfully assigned task ${taskKey} to ${assignee} (ID: ${assigneeId})`);

      return NextResponse.json(
        {
          success: true,
          message: `Successfully assigned task ${taskKey} to ${assignee}`,
          data: {
            taskKey,
            assignee,
            assigneeId
          }
        },
        {
          headers: {
            'X-Show-Toast': JSON.stringify({
              type: 'success',
              message: `Successfully assigned task ${taskKey} to ${assignee}`
            })
          }
        }
      );
    } catch (error: any) {
      console.error('[Assign Task API] Error from Jira service:', error);
      
      // Get more detailed error information if available
      let errorMessage = error.message;
      let errorDetails = {};
      
      if (error.response) {
        errorMessage = `${error.message} - Status: ${error.response.status}`;
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        console.error('[Assign Task API] Response error details:', errorDetails);
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to assign task in Jira',
          message: errorMessage,
          details: {
            taskKey,
            assignee,
            assigneeId,
            errorMessage,
            ...errorDetails
          }
        },
        { 
          status: 500,
          headers: {
            'X-Show-Toast': JSON.stringify({
              type: 'error',
              message: `Failed to assign task: ${errorMessage}`
            })
          }
        }
      );
    }
  } catch (error: any) {
    console.error('[Assign Task API] Error in assign-task POST route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      },
      { 
        status: 500,
        headers: {
          'X-Show-Toast': JSON.stringify({
            type: 'error',
            message: 'Internal server error occurred'
          })
        }
      }
    );
  }
} 