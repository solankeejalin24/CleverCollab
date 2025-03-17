import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { serverEnv } from '@/lib/env';
import { auth, currentUser } from "@clerk/nextjs/server";
import { JiraService, FormattedJiraIssue, JiraIssue } from '@/lib/jira';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: serverEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// Define the skill type
interface Skill {
  id: string;
  name: string;
  category: string;
  teamMemberId?: string;
  teamMemberName?: string;
}

// Helper interface for team member workload
interface TeamMemberWorkload {
  name: string;
  email: string;
  totalTasks: number;
  estimatedHoursRemaining: number;
  skills: string[];
  upcomingDeadlines: {
    taskKey: string;
    dueDate: string;
  }[];
}

// Interface for automation metadata
interface AutomationMetadata {
  type: 'ASSIGN_TASK';
  taskKey: string;
  assignee: string;
  assigneeEmail: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  actionUrl: string; // URL to call for automation
  successMessage: string; // Message to show in toast after success
}

// Add message type definition
interface ChatMessage {
  role: string;
  content: string;
}

// Define team member interface
interface TeamMember {
  id: string;
  name: string;
  email: string;
}

// Function to calculate team member workloads
function calculateTeamWorkloads(
  allIssues: FormattedJiraIssue[],
  skills: Skill[]
): Map<string, TeamMemberWorkload> {
  const workloads = new Map<string, TeamMemberWorkload>();
  const emailToName = new Map<string, string>();
  const nameToEmail = new Map<string, string>();

  // First, build complete mapping of names and emails
  allIssues.forEach(issue => {
    if (issue.assignee && issue.assigneeEmail) {
      const normalizedName = issue.assignee.toLowerCase();
      const normalizedEmail = issue.assigneeEmail.toLowerCase();
      emailToName.set(normalizedEmail, issue.assignee);
      nameToEmail.set(normalizedName, issue.assigneeEmail);
    }
  });

  // Initialize workloads for all team members from skills data
  const uniqueTeamMembers = new Set<string>();
  skills.forEach(skill => {
    if (skill.teamMemberName) {
      uniqueTeamMembers.add(skill.teamMemberName);
    }
  });

  // Initialize workload entries for all team members from skills
  uniqueTeamMembers.forEach(teamMember => {
    const teamMemberSkills = skills
      .filter(skill => skill.teamMemberName === teamMember)
      .map(skill => `${skill.name} (${skill.category})`);

    const normalizedName = teamMember.toLowerCase();
    const email = nameToEmail.get(normalizedName) || '';
    
    workloads.set(normalizedName, {
      name: teamMember,
      email: email,
      totalTasks: 0,
      estimatedHoursRemaining: 0,
      skills: teamMemberSkills,
      upcomingDeadlines: []
    });
  });

  // Create a reverse mapping for any assignees not in skills data
  allIssues.forEach(issue => {
    if (issue.assignee && !workloads.has(issue.assignee.toLowerCase())) {
      const normalizedName = issue.assignee.toLowerCase();
      workloads.set(normalizedName, {
        name: issue.assignee,
        email: issue.assigneeEmail || '',
        totalTasks: 0,
        estimatedHoursRemaining: 0,
        skills: [],
        upcomingDeadlines: []
      });
    }
  });

  // Process all issues to update workloads
  allIssues.forEach(issue => {
    if (!issue.assignee) return;

    const normalizedName = issue.assignee.toLowerCase();
    const workload = workloads.get(normalizedName);
    
    if (workload) {
      // Update workload metrics
      workload.totalTasks++;
      if (typeof issue.estimatedHours === 'number') {
        workload.estimatedHoursRemaining += issue.estimatedHours;
      }

      if (issue.dueDate) {
        workload.upcomingDeadlines.push({
          taskKey: issue.key,
          dueDate: issue.dueDate
        });
      }
    }
  });

  return workloads;
}

// Function to find task by key
function findTaskByKey(allIssues: FormattedJiraIssue[], taskKey: string): FormattedJiraIssue | undefined {
  return allIssues.find(issue => issue.key.toLowerCase() === taskKey.toLowerCase());
}

// Function to format workload information
function formatWorkloadSummary(workloads: Map<string, TeamMemberWorkload>): string {
  return Array.from(workloads.entries())
    .map(([_, workload]) => {
      // Sort deadlines by date
      const sortedDeadlines = [...workload.upcomingDeadlines].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      return `
### ${workload.name}
- Total Tasks: ${workload.totalTasks}
- Total Estimated Hours Remaining: ${workload.estimatedHoursRemaining.toFixed(1)}
- Skills: ${workload.skills.join(', ') || 'No skills recorded'}
- Upcoming Deadlines: ${sortedDeadlines.map(d => `${d.taskKey} (Due: ${d.dueDate})`).join(', ') || 'None'}`;
    })
    .join('\n');
}

// Function to load skills data
async function loadSkills(): Promise<Skill[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'skills.json');
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      console.log('Skills file not found');
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading skills:', error);
    return [];
  }
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

// Function to check if a message is about task assignment
function isTaskAssignmentQuery(message: string): { isAssignment: boolean; taskKey?: string } {
  const assignmentPatterns = [
    /whom\s+should\s+I\s+assign\s+task\s+([A-Za-z0-9-]+)/i,
    /assign\s+task\s+([A-Za-z0-9-]+)\s+to/i,
    /who\s+should\s+([A-Za-z0-9-]+)\s+be\s+assigned\s+to/i,
    /pls\s+assign\s+(?:task\s+)?([A-Za-z0-9-]+)\s+to/i,
    /please\s+assign\s+(?:task\s+)?([A-Za-z0-9-]+)\s+to/i,
    /assign\s+([A-Za-z0-9-]+)\s+to/i
  ];

  for (const pattern of assignmentPatterns) {
    const match = message.match(pattern);
    if (match) {
      return { isAssignment: true, taskKey: match[1].toUpperCase() };
    }
  }

  return { isAssignment: false };
}

// Function to prepare automation metadata for task assignment
function prepareTaskAssignmentAutomation(
  taskKey: string,
  assignee: string,
  assigneeId: string,
  reasoning: string
): AutomationMetadata {
  return {
    type: 'ASSIGN_TASK',
    taskKey,
    assignee,
    assigneeEmail: assigneeId, // This now contains the account ID
    confidence: 'HIGH',
    reasoning,
    actionUrl: `/api/jira/assign-task?taskKey=${taskKey}&assignee=${encodeURIComponent(assigneeId)}`,
    successMessage: `Successfully assigned task ${taskKey} to ${assignee}`
  };
}

// Function to check if message is a task assignment confirmation
function isTaskAssignmentConfirmation(message: string): boolean {
  const confirmationPattern = /^(yes|ok|sure|proceed|confirm|do it|assign it|go ahead)/i;
  return confirmationPattern.test(message.trim());
}

// Function to handle task assignment
async function handleTaskAssignment(taskKey: string, assignee: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/jira/assign-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskKey, assignee }),
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: `Successfully assigned task ${taskKey} to ${assignee}`,
      };
    } else {
      return {
        success: false,
        message: `Failed to assign task: ${data.error}`,
      };
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    return {
      success: false,
      message: 'Failed to assign task due to an error',
    };
  }
}

// Function to handle task assignment confirmation
async function handleTaskAssignmentConfirmation(
  taskKey: string,
  assigneeId: string,
  assigneeName: string
): Promise<Response> {
  try {
    console.log(`[Chat API] Attempting to assign task ${taskKey} to ${assigneeName} (ID: ${assigneeId})`);
    
    // Create a new JiraService instance
    const jiraService = new JiraService();
    
    // Directly call the assignIssue method
    await jiraService.assignIssue(taskKey, assigneeId);
    
    console.log(`[Chat API] Successfully assigned task ${taskKey} to ${assigneeName} (ID: ${assigneeId})`);
    
    // Set headers with toast notification
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Show-Toast': JSON.stringify({
        type: 'success',
        message: `Successfully assigned task ${taskKey} to ${assigneeName}`
      })
    });

    console.log('[Chat API] Setting toast notification header for successful assignment');

    // Return success response
    return new Response(
      JSON.stringify({
        message: `Task ${taskKey} has been successfully assigned to ${assigneeName}.`,
        success: true
      }),
      { headers }
    );
  } catch (error: any) {
    console.error('[Chat API] Error assigning task:', error);
    
    // Set headers with error toast notification
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Show-Toast': JSON.stringify({
        type: 'error',
        message: `Failed to assign task: ${error.message}`
      })
    });

    console.log('[Chat API] Setting toast notification header for failed assignment');

    // Return error response
    return new Response(
      JSON.stringify({
        message: `Failed to assign task: ${error.message}`,
        success: false
      }),
      { headers, status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log("[Chat API] Chat API route called");
    
    // Get the request body
    const body = await req.json();
    console.log("[Chat API] Request body:", JSON.stringify(body, null, 2));
    
    const { messages: rawMessages, automationContext, userEmail: requestUserEmail } = body;
    const lastUserMessage = rawMessages.findLast((msg: ChatMessage) => msg.role === 'user')?.content || '';
    
    // Load team members data
    const teamMembers = await loadTeamMembers();
    console.log(`[Chat API] Loaded ${teamMembers.length} team members`);
    
    // Check if this is a confirmation of a pending task assignment
    if (automationContext?.type === 'ASSIGN_TASK' && isTaskAssignmentConfirmation(lastUserMessage)) {
      console.log("[Chat API] Detected task assignment confirmation with automation context, processing...");
      
      // Handle the task assignment confirmation
      return handleTaskAssignmentConfirmation(
        automationContext.taskKey,
        automationContext.assigneeEmail, // This now contains the account ID
        automationContext.assignee
      );
    }
    
    // Check if this is a direct assignment request with confirmation words
    const directAssignmentResult = isTaskAssignmentQuery(lastUserMessage);
    if (directAssignmentResult.isAssignment) {
      console.log("[Chat API] Detected direct assignment request:", directAssignmentResult);
      
      // Find the task
      const jiraService = new JiraService();
      const allIssuesResponse = await jiraService.getIssues('project is not EMPTY', 5000);
      const allIssues = allIssuesResponse.map(issue => jiraService.formatIssue(issue));
      const task = findTaskByKey(allIssues, directAssignmentResult.taskKey || '');
      
      if (task) {
        console.log(`[Chat API] Found task: ${task.key} - ${task.summary}`);
        
        // Extract assignee from message
        const assigneeMatch = lastUserMessage.match(/(?:to|assign to|assign it to)\s+(\w+(?:\s+\w+)*)\s*$/i);
        if (assigneeMatch) {
          const requestedAssignee = assigneeMatch[1].toLowerCase();
          console.log(`[Chat API] Extracted assignee from message: "${requestedAssignee}"`);
          
          // Find team member
          const teamMember = findTeamMemberByName(teamMembers, requestedAssignee);
          if (teamMember) {
            console.log(`[Chat API] Found team member: ${teamMember.name} (ID: ${teamMember.id})`);
            
            // Check if this is also a confirmation message
            if (isTaskAssignmentConfirmation(lastUserMessage)) {
              console.log("[Chat API] Message also contains confirmation, directly assigning task");
              
              // Directly assign the task
              return handleTaskAssignmentConfirmation(
                task.key,
                teamMember.id,
                teamMember.name
              );
            }
          } else {
            console.log(`[Chat API] Could not find team member for: "${requestedAssignee}"`);
          }
        }
      } else {
        console.log(`[Chat API] Could not find task with key: ${directAssignmentResult.taskKey}`);
      }
    }
    
    // Get the user's email from the request body or from the auth session
    let userEmail = requestUserEmail;
    
    // If userEmail is not provided in the request body, try to get it from the auth session
    if (!userEmail) {
      const user = await currentUser();
      if (user?.emailAddresses?.[0]?.emailAddress) {
        userEmail = user.emailAddresses[0].emailAddress;
      } else {
        console.warn('[Chat API] No user email found in request or session');
      }
    }
    
    // Log the user email for debugging
    console.log('[Chat API] Using user email:', userEmail);
    
    // Fetch Jira issues
    let userIssues: FormattedJiraIssue[] = [];
    let allIssues: FormattedJiraIssue[] = [];
    let tasksByAssignee = '';
    
    try {
      const jiraService = new JiraService();
      
      // Log all assignee information for debugging
      console.log('Fetching all issues to check assignees...');
      const allIssuesResponse = await jiraService.getIssues('project is not EMPTY ORDER BY assignee', 5000);
      console.log('All assignees:', allIssuesResponse.map(issue => ({
        key: issue.key,
        assignee: issue.fields.assignee?.displayName,
        accountId: issue.fields.assignee?.accountId,
        email: issue.fields.assignee?.emailAddress
      })));

      // Format all issues
      allIssues = allIssuesResponse.map(issue => jiraService.formatIssue(issue));
      
      // Filter issues for the current user
      if (userEmail) {
        userIssues = allIssues.filter(issue => 
          issue.assigneeEmail?.toLowerCase() === userEmail.toLowerCase()
        );
      }
      
      console.log(`Retrieved ${allIssues.length} total issues and ${userIssues.length} user issues from Jira`);
      
      // Group issues by assignee for debugging
      const issuesByAssignee = new Map<string, FormattedJiraIssue[]>();
      allIssues.forEach(issue => {
        const assignee = issue.assignee || 'Unassigned';
        if (!issuesByAssignee.has(assignee)) {
          issuesByAssignee.set(assignee, []);
        }
        issuesByAssignee.get(assignee)?.push(issue);
      });
      
      console.log('Issues grouped by assignee:', 
        Array.from(issuesByAssignee.entries()).map(([assignee, issues]) => ({
          assignee,
          count: issues.length,
          issues: issues.map(i => i.key)
        }))
      );

      // Format tasks by assignee for the system message
      tasksByAssignee = Array.from(issuesByAssignee.entries())
        .map(([assignee, issues]: [string, FormattedJiraIssue[]]) => 
          `### ${assignee}:\n${issues.map((issue: FormattedJiraIssue) => 
            `- ${issue.key}: ${issue.summary} (Type: ${issue.issueType}, Status: ${issue.status}${issue.dueDate ? `, Due: ${issue.dueDate}` : ''})${issue.estimatedHours ? `, Est. Hours: ${issue.estimatedHours}` : ''}`
          ).join('\n')}`
        ).join('\n\n');
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
    }
    
    // Load skills data
    const skills = await loadSkills();
    console.log(`Loaded ${skills.length} skills`);
    
    // Get user skills
    const userSkills = userEmail 
      ? skills.filter((skill: Skill) => {
          const teamMember = skill.teamMemberName || '';
          return userEmail.includes(teamMember) || teamMember.includes(userEmail);
        })
      : [];
    
    // Extract only the fields that OpenAI accepts
    const messages = rawMessages.map((message: any) => ({
        role: message.role,
        content: message.content
    }));
    
    // Check if the last user message is about task assignment
    const assignmentQueryResult = isTaskAssignmentQuery(lastUserMessage);
    
    let automationMetadata: AutomationMetadata | null = null;
    let shouldExecuteAssignment = false;

    // Handle task assignment automation
    if (assignmentQueryResult.isAssignment) {
      const task = findTaskByKey(allIssues, assignmentQueryResult.taskKey || '');
      if (task) {
        // Load team members for ID lookup
        const teamMembers = await loadTeamMembers();
        
        // Check if this is a confirmation message
        const isConfirmation = /^(?:yes|ok|sure|confirm|proceed|go ahead|do it)(?:\s+assign\s+it\s+to\s+(\w+(?:\s+\w+)*))?/i.test(lastUserMessage);
        
        // Check if the message contains a specific assignee
        const assigneeMatch = lastUserMessage.match(/(?:to|assign to|assign it to)\s+(\w+(?:\s+\w+)*)\s*$/i);
        
        if (assigneeMatch) {
          // User specified an assignee
          const requestedAssignee = assigneeMatch[1].toLowerCase();
          const teamWorkloads = calculateTeamWorkloads(allIssues, skills);
          const matchingWorkload = Array.from(teamWorkloads.values())
            .find(member => member.name.toLowerCase().includes(requestedAssignee));

          if (matchingWorkload) {
            // Find the team member ID
            const teamMember = findTeamMemberByName(teamMembers, matchingWorkload.name);
            
            if (teamMember) {
              automationMetadata = prepareTaskAssignmentAutomation(
                task.key,
                matchingWorkload.name,
                teamMember.id,
                `User requested to assign task to ${matchingWorkload.name}`
              );
              shouldExecuteAssignment = isConfirmation;
              
              console.log(`Found team member ID for ${matchingWorkload.name}: ${teamMember.id}`);
            } else {
              console.warn(`Could not find team member ID for ${matchingWorkload.name}`);
            }
          }
        } else if (isConfirmation) {
          // User confirmed the last suggested assignment
          const previousMessage = messages[messages.length - 2]?.content || '';
          const previousAssigneeMatch = previousMessage.match(/assign\s+(?:this\s+)?task\s+to\s+(\w+(?:\s+\w+)*)/i);
          
          if (previousAssigneeMatch) {
            const suggestedAssignee = previousAssigneeMatch[1].toLowerCase();
            const teamWorkloads = calculateTeamWorkloads(allIssues, skills);
            const matchingWorkload = Array.from(teamWorkloads.values())
              .find(member => member.name.toLowerCase().includes(suggestedAssignee));

            if (matchingWorkload) {
              // Find the team member ID
              const teamMember = findTeamMemberByName(teamMembers, matchingWorkload.name);
              
              if (teamMember) {
                automationMetadata = prepareTaskAssignmentAutomation(
                  task.key,
                  matchingWorkload.name,
                  teamMember.id,
                  'User confirmed the suggested assignment'
                );
                shouldExecuteAssignment = true;
                
                console.log(`Found team member ID for ${matchingWorkload.name}: ${teamMember.id}`);
              } else {
                console.warn(`Could not find team member ID for ${matchingWorkload.name}`);
              }
            }
          }
        } else {
          // No specific assignee mentioned, find the best match
          const teamWorkloads = calculateTeamWorkloads(allIssues, skills);
          const bestAssignee = Array.from(teamWorkloads.values())
            .sort((a, b) => {
              const hoursDiff = a.estimatedHoursRemaining - b.estimatedHoursRemaining;
              return hoursDiff !== 0 ? hoursDiff : a.totalTasks - b.totalTasks;
            })[0];

          if (bestAssignee) {
            // Find the team member ID
            const teamMember = findTeamMemberByName(teamMembers, bestAssignee.name);
            
            if (teamMember) {
              automationMetadata = prepareTaskAssignmentAutomation(
                task.key,
                bestAssignee.name,
                teamMember.id,
                'Selected based on current workload and relevant skills.'
              );
              
              console.log(`Found team member ID for ${bestAssignee.name}: ${teamMember.id}`);
            } else {
              console.warn(`Could not find team member ID for ${bestAssignee.name}`);
            }
          }
        }

        // If we should execute the assignment and have valid metadata
        if (shouldExecuteAssignment && automationMetadata) {
          try {
            const jiraService = new JiraService();
            await jiraService.assignIssue(automationMetadata.taskKey, automationMetadata.assigneeEmail);
            console.log(`Successfully assigned ${automationMetadata.taskKey} to ${automationMetadata.assignee} (ID: ${automationMetadata.assigneeEmail})`);
          } catch (error: any) {
            console.error('Error assigning task:', error);
            throw new Error(`Failed to assign task: ${error.message}`);
          }
        }
      }
    }
    
    // Add a system message if not already present
    const hasSystemMessage = messages.some((msg: { role: string }) => msg.role === 'system');
    
    if (!hasSystemMessage) {
      // Calculate team workloads
      const teamWorkloads = calculateTeamWorkloads(allIssues, skills);
      
      // Format workload information for the system message
      const workloadInformation = formatWorkloadSummary(teamWorkloads);

      // Get unassigned tasks
      const unassignedTasks = allIssues.filter(issue => !issue.assignee);
      const unassignedTasksFormatted = unassignedTasks.map(issue =>
        `${issue.key}: ${issue.summary} (Type: ${issue.issueType}, Status: ${issue.status}${issue.dueDate ? `, Due: ${issue.dueDate}` : ''})${issue.estimatedHours ? `, Est. Hours: ${issue.estimatedHours}` : ''}`
      ).join('\n');

      // Format user's tasks with workload summary
      const userTasksFormatted = userIssues.map(issue => 
        `${issue.key}: ${issue.summary} (Status: ${issue.status}, Due: ${issue.dueDate || 'Not set'})${issue.estimatedHours ? `, Est. Hours: ${issue.estimatedHours}` : ''}`
      ).join('\n');

      // Calculate user workload summary
      const totalUserTasks = userIssues.length;
      const totalEstimatedHours = userIssues.reduce((total, issue) => 
        total + (issue.estimatedHours || 0), 0
      );

      const workloadSummary = `
WORKLOAD SUMMARY:
- Total Assigned Tasks: ${totalUserTasks}
- Total Estimated Hours Remaining: ${totalEstimatedHours.toFixed(1)} hours`;
      
      // Format user's skills
      const userSkillsFormatted = userSkills.map((skill: Skill) => 
        `${skill.name} (${skill.category})`
      ).join(', ');
      
      // Format team skills
      const teamSkillsMap = new Map<string, string[]>();
      skills.forEach((skill: Skill) => {
        if (skill.teamMemberName) {
          if (!teamSkillsMap.has(skill.teamMemberName)) {
            teamSkillsMap.set(skill.teamMemberName, []);
          }
          teamSkillsMap.get(skill.teamMemberName)?.push(`${skill.name} (${skill.category})`);
        }
      });
      
      const teamSkillsFormatted = Array.from(teamSkillsMap.entries())
        .map(([name, skills]) => `${name}: ${skills.join(', ')}`)
        .join('\n');
      
      // Add a system message at the beginning
      messages.unshift({
        role: 'system',
        content: `You are a Project Management AI Assistant that helps with task assignments, prioritization, workload management, and identifying project bottlenecks.
        
When answering questions:
1. Provide clear, actionable recommendations
2. Explain your reasoning process
3. Be specific about task assignments, priorities, and potential issues
4. Consider both skills and current workload when making recommendations

For task assignment recommendations:
1. Consider team member skills and expertise
2. Evaluate current workload and estimated hours
3. Check upcoming deadlines and time constraints
4. Balance workload across the team
5. Consider task requirements and complexity

IMPORTANT INSTRUCTIONS FOR TASK ASSIGNMENTS:
When someone asks "Who should I assign task X to?" or similar questions:
1. Always include the task key (e.g., "PN2-13") in your response
2. Clearly state your recommendation with phrases like "I recommend assigning this task to [Name]" or "Task X should be assigned to [Name]"
3. Provide your reasoning for the recommendation
4. Do not ask for confirmation - the UI will automatically show an assignment button

FORMATTING INSTRUCTIONS:
- Use proper markdown formatting in your responses
- Use headings (### for main sections, #### for subsections)
- Use bullet points or numbered lists for steps or items
- Use **bold** for emphasis on important points
- Use tables when comparing multiple options or data
- Format code or technical terms with backticks

Current user email: ${userEmail || 'Unknown'}
Current date: ${new Date().toLocaleDateString()}

${workloadSummary}

TEAM WORKLOAD OVERVIEW:
${workloadInformation}

UNASSIGNED TASKS:
${unassignedTasksFormatted || 'No unassigned tasks'}

USER'S TASKS:
${userTasksFormatted || 'No tasks assigned'}

USER'S SKILLS:
${userSkillsFormatted || 'No skills recorded'}

TEAM SKILLS:
${teamSkillsFormatted || 'No team skills recorded'}

PROJECT TASKS BY ASSIGNEE:
${tasksByAssignee}

You have access to this data to help answer questions about task assignments, prioritization, workload management, and identifying project bottlenecks.

When asked about task assignments:
1. First check if the task exists in the unassigned tasks list
2. Analyze the task requirements and estimated hours
3. Compare with team members' skills and current workload
4. Consider upcoming deadlines and time constraints
5. Provide a clear recommendation with reasoning`
      });

      // Add automation metadata to the system message
      const systemMessageContent = `${messages[0].content}

${automationMetadata ? `
AUTOMATION CONTEXT:
{
  "type": "${automationMetadata.type}",
  "taskKey": "${automationMetadata.taskKey}",
  "assignee": "${automationMetadata.assignee}",
  "assigneeEmail": "${automationMetadata.assigneeEmail}",
  "confidence": "${automationMetadata.confidence}",
  "reasoning": "${automationMetadata.reasoning}",
  "actionUrl": "${automationMetadata.actionUrl}",
  "successMessage": "${automationMetadata.successMessage}"
}

When responding to this query:
1. Make your recommendation for task assignment
2. End your response with:
   "Would you like me to automatically assign this task to [assignee]? Click the automation button below to proceed."
3. If the user suggests a different assignee, acknowledge it and offer to automate that assignment instead.
4. After successful automation, a confirmation message will appear.` : ''}`;

      messages[0].content = systemMessageContent;
    }
    
    // Create a clean request body for OpenAI
    const openaiRequestBody = {
      model: body.model || "gpt-4",  // Fixed model name
      messages: messages,
      temperature: body.temperature || 0.7,
      stream: true
    };
    
    // Log the OpenAI request
    console.log("OpenAI request:", JSON.stringify(openaiRequestBody, null, 2));
    
    // Use direct fetch to OpenAI API for better control over the response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openaiRequestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Get the response body as a readable stream
    const responseBody = response.body;
    if (!responseBody) {
      throw new Error('No response body from OpenAI');
    }
    
    // Create a transform stream to extract just the content from the OpenAI stream
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          // Convert the chunk to text
          const text = new TextDecoder().decode(chunk);
          
          // Process each line in the chunk
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            // Skip [DONE] or empty lines
            if (line.includes('[DONE]') || !line.trim()) continue;
            
            // Extract the data part
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              
              // Skip empty data
              if (!data) continue;
              
              try {
                // Parse the JSON data
                const json = JSON.parse(data);
                
                // Extract the content if available
                if (json.choices && 
                    json.choices[0] && 
                    json.choices[0].delta && 
                    json.choices[0].delta.content) {
                  // Get just the content
                  const content = json.choices[0].delta.content;
                  // Send only the content
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (error) {
                console.error('Error parsing JSON line:', error);
                console.log('Problematic line:', data);
                // Don't throw, just continue with the next line
                continue;
              }
            }
          }
        } catch (error) {
          console.error('Error in transform:', error);
          // Don't throw, just log the error
        }
      }
    });
    
    // Pipe the response through the transform stream
    const processedStream = responseBody.pipeThrough(transformStream);
    
    console.log("OpenAI API response received, streaming back to client");
    
    // Modify the response to include automation metadata and toast notification
    const headers: Record<string, string> = {
        'Content-Type': 'text/plain; charset=utf-8',
      'X-Automation-Available': automationMetadata ? 'true' : 'false'
    };

    if (shouldExecuteAssignment) {
      headers['X-Show-Toast'] = JSON.stringify({
        type: 'success',
        message: `Successfully assigned task ${automationMetadata?.taskKey} to ${automationMetadata?.assignee}`
      });
      console.log('Setting toast notification header for automatic assignment');
    }

    if (automationMetadata) {
      headers['X-Automation-Metadata'] = JSON.stringify({
        type: automationMetadata.type,
        taskKey: automationMetadata.taskKey,
        assignee: automationMetadata.assignee,
        assigneeEmail: automationMetadata.assigneeEmail,
        confidence: automationMetadata.confidence,
        reasoning: automationMetadata.reasoning,
        actionUrl: automationMetadata.actionUrl,
        successMessage: automationMetadata.successMessage,
        showToast: shouldExecuteAssignment
      });
    }

    return new Response(processedStream, { headers });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 