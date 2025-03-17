import { NextResponse } from 'next/server';
import { JiraService } from '@/lib/jira';
import fs from 'fs';
import path from 'path';

// Define the interface for issue data to match JiraService.createIssue
interface IssueData {
  summary: string;
  description: string;
  issueType: string;
  projectKey: string;
  startDate?: string;
  dueDate?: string;
  assignee?: string;
  estimatedHours?: number;
}

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

export async function POST(request: Request) {
  try {
    console.log('[Jira Create API] POST request received');
    
    const requestData = await request.json();
    console.log('[Jira Create API] Received issue data:', requestData);

    // Create a clean IssueData object
    const issueData: IssueData = {
      summary: requestData.summary,
      description: requestData.description,
      issueType: requestData.issueType || 'Task',
      projectKey: requestData.projectKey || 'PN2',
    };

    // Add optional fields if provided
    if (requestData.startDate) {
      issueData.startDate = requestData.startDate;
    }

    // Add optional due date
    if (requestData.dueDate) {
      issueData.dueDate = requestData.dueDate;
    } else if (requestData.estimatedHours !== undefined) {
      // Auto-calculate due date based on estimated hours if not provided
      const estimatedHours = typeof requestData.estimatedHours === 'string' 
        ? parseFloat(requestData.estimatedHours)
        : requestData.estimatedHours;
      
      if (!isNaN(estimatedHours)) {
        // Calculate due date: start date + days based on effort
        const startDate = requestData.startDate || new Date().toISOString().split('T')[0];
        const startDateObj = new Date(startDate);
        
        // Default to 3 days from start date
        let daysToAdd = 3;
        
        // Add 1 day per 4 hours of work, plus 1 day buffer
        // Minimum 2 days, maximum 14 days
        daysToAdd = Math.min(14, Math.max(2, Math.ceil(estimatedHours / 4) + 1));
        
        startDateObj.setDate(startDateObj.getDate() + daysToAdd);
        issueData.dueDate = startDateObj.toISOString().split('T')[0];
        
        console.log(`[Jira Create API] Auto-calculated due date: ${issueData.dueDate} (${daysToAdd} days from start date)`);
      }
    }

    // Handle assignee - look up the actual ID from team_members.json
    if (requestData.assigneeAccountId) {
      console.log(`[Jira Create API] Processing assignee: ${requestData.assigneeAccountId}`);
      
      // Load team members data
      const teamMembers = await loadTeamMembers();
      
      // First try to match by ID
      let teamMember = teamMembers.find(m => m.id === requestData.assigneeAccountId);
      
      if (teamMember) {
        console.log(`[Jira Create API] Found team member by ID: ${teamMember.name} (${teamMember.id})`);
        issueData.assignee = teamMember.id;
      } else {
        // Try to match by email
        const isEmail = requestData.assigneeAccountId.includes('@');
        
        if (isEmail) {
          teamMember = teamMembers.find(m => 
            m.email.toLowerCase() === requestData.assigneeAccountId.toLowerCase()
          );
          
          if (teamMember) {
            console.log(`[Jira Create API] Found team member by email: ${teamMember.name} (${teamMember.id})`);
            issueData.assignee = teamMember.id;
          } else {
            console.log(`[Jira Create API] No team member found with email: ${requestData.assigneeAccountId}`);
            // Use as-is as fallback
            issueData.assignee = requestData.assigneeAccountId;
          }
        } else {
          // Try to match by name
          teamMember = teamMembers.find(m => 
            m.name.toLowerCase().includes(requestData.assigneeAccountId.toLowerCase()) ||
            requestData.assigneeAccountId.toLowerCase().includes(m.name.toLowerCase())
          );
          
          if (teamMember) {
            console.log(`[Jira Create API] Found team member by name: ${teamMember.name} (${teamMember.id})`);
            issueData.assignee = teamMember.id;
          } else {
            console.log(`[Jira Create API] No team member found with name: ${requestData.assigneeAccountId}`);
            // Use as-is as fallback
            issueData.assignee = requestData.assigneeAccountId;
          }
        }
      }
      
      console.log(`[Jira Create API] Final assignee ID: ${issueData.assignee}`);
    }
    
    // Handle estimated hours
    if (requestData.estimatedHours !== undefined) {
      // Make sure it's a number
      if (typeof requestData.estimatedHours === 'string') {
        const parsedHours = parseFloat(requestData.estimatedHours);
        if (!isNaN(parsedHours)) {
          issueData.estimatedHours = parsedHours;
          console.log(`[Jira Create API] Parsed estimated hours from string to number: ${parsedHours}`);
        } else {
          console.warn(`[Jira Create API] Invalid estimated hours value: ${requestData.estimatedHours}, not setting field`);
        }
      } else {
        issueData.estimatedHours = requestData.estimatedHours;
      }
    }
    
    console.log('[Jira Create API] Cleaned request data for Jira:', issueData);

    // Create a new instance of the JiraService
    const jiraService = new JiraService();
    
    try {
      // Create the issue
      const response = await jiraService.createIssue(issueData);
      console.log('[Jira Create API] Issue created successfully:', response);
      
      // Make sure we have a valid response with at least an ID
      if (!response) {
        return NextResponse.json({
          success: false,
          error: 'Empty response from Jira API',
          details: { originalRequest: requestData }
        }, { status: 500 });
      }
      
      // Check if we have a key or id
      if (!response.key && !response.id) {
        console.warn('[Jira Create API] Response missing key and id:', response);
        // Try to add a fallback key
        response.key = 'TASK-NEW';
      }

      // If a specific status was requested, update the issue status after creation
      if (requestData.status && response.key) {
        try {
          console.log(`[Jira Create API] Updating issue ${response.key} to status: ${requestData.status}`);
          
          // Call the update-status API
          const updateResponse = await fetch(new URL('/api/jira/update-status', request.url), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              issueKey: response.key,
              statusCategory: requestData.status
            })
          });
          
          const updateData = await updateResponse.json();
          
          if (updateData.success) {
            console.log(`[Jira Create API] Successfully updated status of ${response.key} to ${requestData.status}`);
          } else {
            console.warn(`[Jira Create API] Failed to update status: ${updateData.error}`);
          }
        } catch (statusError) {
          console.error('[Jira Create API] Error updating issue status:', statusError);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created issue: ${response.key || response.id}`,
        data: response
      });
    } catch (error: any) {
      console.error('[Jira Create API] Error creating issue:', error);
      
      // Extract more detailed error information if available
      let errorDetails = {};
      let statusCode = 500;
      
      if (error.response) {
        statusCode = error.response.status;
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        
        console.error('[Jira Create API] Error response details:', errorDetails);
      }
      
      // Check for specific error cases
      if (statusCode === 400 && error.response?.data?.errors) {
        // Try to provide more helpful error messages for common validation errors
        const errors = error.response.data.errors;
        let errorMessage = 'Validation error in Jira API';
        
        if (errors.assignee) {
          errorMessage = `Invalid assignee format: ${errors.assignee}`;
        } else if (errors.customfield_10040) {
          errorMessage = `Invalid estimated hours format: ${errors.customfield_10040}`;
        } else if (errors.summary) {
          errorMessage = `Invalid summary: ${errors.summary}`;
        } else if (errors.description) {
          errorMessage = `Invalid description: ${errors.description}`;
        }
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          details: {
            validationErrors: errors,
            originalRequest: requestData
          }
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: `Failed to create issue: ${error.message}`,
        details: errorDetails
      }, { status: statusCode });
    }
  } catch (error: any) {
    console.error('[Jira Create API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 