import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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

    console.log(`[Assign Task API] Request body:`, body);
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
    
    // Load team members data
    const teamMembers = await loadTeamMembers();
    console.log(`[Assign Task API] Loaded ${teamMembers.length} team members`);
    console.log('[Assign Task API] Available team members:', teamMembers.map(m => ({ id: m.id, name: m.name, email: m.email })));
    
    // Determine if assignee is an ID, email, or name
    let assigneeId = assignee;
    let assigneeType = 'unknown';
    let assigneeDisplayName = assignee;
    let teamMember: TeamMember | undefined;
    
    // Try to find the team member by ID first
    teamMember = teamMembers.find(m => m.id === assignee);
    
    if (teamMember) {
      // Found by ID
      assigneeType = 'id_match';
      assigneeId = teamMember.id;
      assigneeDisplayName = teamMember.name;
      console.log(`[Assign Task API] Found team member by ID: ${assigneeDisplayName} (${assigneeId})`);
    } else {
      // Check if it's an email address
      const isEmail = assignee.includes('@');
      
      if (isEmail) {
        // Try to find the team member by email
        teamMember = teamMembers.find(m => m.email.toLowerCase() === assignee.toLowerCase());
        
        if (teamMember) {
          assigneeType = 'email_match';
          assigneeId = teamMember.id; // Use the ID from team_members.json
          assigneeDisplayName = teamMember.name;
          console.log(`[Assign Task API] Found team member by email: ${assigneeDisplayName} (${assigneeId})`);
        } else {
          assigneeType = 'email_unmatched';
          console.log(`[Assign Task API] Email not found in team members: ${assignee}`);
        }
      } else {
        // Try to find the team member by name
        teamMember = findTeamMemberByName(teamMembers, assignee);
        
        if (teamMember) {
          assigneeType = 'name_match';
          assigneeId = teamMember.id; // Use the ID from team_members.json
          assigneeDisplayName = teamMember.name;
          console.log(`[Assign Task API] Found team member by name: ${assigneeDisplayName} (${assigneeId})`);
        } else {
          assigneeType = 'name_unmatched';
          console.log(`[Assign Task API] Name not found in team members: ${assignee}`);
        }
      }
    }
    
    // Log the final assignment decision
    console.log(`[Assign Task API] Final assignee determination: [Name: ${assigneeDisplayName}] [ID: ${assigneeId}] [Type: ${assigneeType}]`);
    
    // Check if we couldn't find an ID
    if (!teamMember && (assigneeType === 'name_unmatched' || assigneeType === 'email_unmatched')) {
      console.warn(`[Assign Task API] Could not find team member ID for ${assignee}`);
      
      if (assigneeType === 'name_unmatched') {
        return NextResponse.json(
          {
            success: false,
            error: 'Could not find team member ID',
            details: {
              assignee,
              assigneeType,
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
    }

    console.log(`[Assign Task API] Creating Jira service instance`);
    const jiraService = new JiraService();

    try {
      console.log(`[Assign Task API] Calling jiraService.assignIssue(${taskKey}, ${assigneeId}) [type: ${assigneeType}]`);
      await jiraService.assignIssue(taskKey, assigneeId);
      console.log(`[Assign Task API] Successfully assigned task ${taskKey} to ${assigneeDisplayName} (ID: ${assigneeId})`);

      // Verify the assignment was successful by fetching the issue
      console.log(`[Assign Task API] Verifying assignment was successful`);
      const issues = await jiraService.getIssues(`key = ${taskKey}`, 1);
      
      if (issues.length === 0) {
        console.warn(`[Assign Task API] Could not verify assignment - issue ${taskKey} not found`);
      } else {
        const issue = issues[0];
        const assigneeInfo = issue.fields.assignee;
        
        console.log(`[Assign Task API] Current assignee for ${taskKey}:`, assigneeInfo || 'Unassigned');
        
        if (!assigneeInfo) {
          console.warn(`[Assign Task API] Assignment verification failed - issue has no assignee`);
          
          // Try one more time with direct approach
          if (teamMember) {
            try {
              console.log(`[Assign Task API] Trying direct Jira Cloud assignment with account ID: ${teamMember.id}`);
              
              // Get the API base
              const apiBase = jiraService.getApiBase();
              const assignUrl = `${apiBase}/issue/${taskKey}/assignee`;
              
              console.log(`[Assign Task API] Using direct assignment URL: ${assignUrl}`);
              
              // Make the direct call
              const directResponse = await axios.put(
                assignUrl,
                { accountId: teamMember.id },
                {
                  headers: jiraService.getHeaders(),
                  auth: jiraService.getAuth()
                }
              );
              
              console.log(`[Assign Task API] Direct assignment response:`, {
                status: directResponse.status,
                statusText: directResponse.statusText
              });
              
              if (directResponse.status === 204 || directResponse.status === 200) {
                console.log(`[Assign Task API] Direct assignment successful!`);
                
                // Re-verify
                const updatedIssues = await jiraService.getIssues(`key = ${taskKey}`, 1);
                if (updatedIssues.length > 0 && updatedIssues[0].fields.assignee) {
                  console.log(`[Assign Task API] Assignment verification successful after direct call!`);
                  
                  // Return success
                  return NextResponse.json(
                    {
                      success: true,
                      message: `Successfully assigned task ${taskKey} to ${assigneeDisplayName}`,
                      data: {
                        taskKey,
                        assignee: assigneeDisplayName,
                        assigneeId: teamMember.id,
                        assigneeType: 'direct_assignment',
                        verificationStatus: 'success'
                      }
                    },
                    {
                      headers: {
                        'X-Show-Toast': JSON.stringify({
                          type: 'success',
                          message: `Successfully assigned task ${taskKey} to ${assigneeDisplayName}`
                        })
                      }
                    }
                  );
                } else {
                  console.warn(`[Assign Task API] Assignment verification failed after direct call`);
                }
              }
            } catch (directError) {
              console.error(`[Assign Task API] Error in direct assignment:`, directError);
            }
          }
          
          return NextResponse.json(
            {
              success: true,
              warning: "API call succeeded but assignee doesn't appear on the issue",
              message: `Task ${taskKey} assignment to ${assigneeDisplayName} was processed, but could not be verified`,
              data: {
                taskKey,
                assignee: assigneeDisplayName,
                assigneeId,
                assigneeType,
                verificationStatus: 'failed'
              }
            },
            {
              headers: {
                'X-Show-Toast': JSON.stringify({
                  type: 'warning',
                  message: `Task created but assignee may not be set`
                })
              }
            }
          );
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `Successfully assigned task ${taskKey} to ${assigneeDisplayName}`,
          data: {
            taskKey,
            assignee: assigneeDisplayName,
            assigneeId,
            assigneeType
          }
        },
        {
          headers: {
            'X-Show-Toast': JSON.stringify({
              type: 'success',
              message: `Successfully assigned task ${taskKey} to ${assigneeDisplayName}`
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