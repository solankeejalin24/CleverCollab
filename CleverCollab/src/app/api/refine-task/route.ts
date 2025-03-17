import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { serverEnv } from "@/lib/env";

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: serverEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { description, summary, issueType, estimatedHours, teamMembers } = await req.json();
    console.log('Refining task with data:', { description, summary, issueType, estimatedHours });
    
    // Prepare team members info for the prompt
    const teamMembersInfo = teamMembers?.map((member: any) => 
      `${member.name} (${member.email})`
    ).join('\n') || 'No team members available';

    // Create a prompt for GPT-4o
    const prompt = `
You are an AI assistant helping to refine a Jira task. Please analyze the following task information and provide refined details:

DESCRIPTION: ${description || 'No description provided'}

CURRENT SUMMARY: ${summary || 'No summary provided'}

CURRENT ISSUE TYPE: ${issueType || 'Task'}

CURRENT ESTIMATED HOURS: ${estimatedHours || 'Not specified'}

TEAM MEMBERS:
${teamMembersInfo}

Based on the description, please provide:
1. A clear, concise summary (title) for the task
2. The appropriate issue type (Task, Story, or Bug)
3. A reasonable estimate of hours needed (1-8)
4. The most suitable team member to assign this task to, based on the task description
5. Any refinements to the description to make it clearer

Return your response in JSON format with these fields:
- summary: string
- issueType: string (Task, Story, or Bug)
- estimatedHours: number
- assigneeName: string (name of team member)
- assigneeId: string (ID of team member)
- description: string (refined description)
`;

    // Call OpenAI API
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI assistant that specializes in project management and task refinement." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    // Extract the response
    const aiResponse = response.choices[0]?.message?.content || '';
    console.log('AI response:', aiResponse);
    
    // Parse the JSON response
    let refinedData;
    try {
      refinedData = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw AI response:', aiResponse);
      
      // Extract data using regex as fallback
      const summaryMatch = aiResponse.match(/summary["\s:]+([^"]+)/i);
      const issueTypeMatch = aiResponse.match(/issueType["\s:]+([^"]+)/i);
      const hoursMatch = aiResponse.match(/estimatedHours["\s:]+(\d+)/i);
      const assigneeNameMatch = aiResponse.match(/assigneeName["\s:]+([^"]+)/i);
      const assigneeIdMatch = aiResponse.match(/assigneeId["\s:]+([^"]+)/i);
      const descriptionMatch = aiResponse.match(/description["\s:]+([^"]+)/i);
      
      refinedData = {
        summary: summaryMatch ? summaryMatch[1].trim() : summary,
        issueType: issueTypeMatch ? issueTypeMatch[1].trim() : issueType,
        estimatedHours: hoursMatch ? parseInt(hoursMatch[1]) : estimatedHours,
        assigneeName: assigneeNameMatch ? assigneeNameMatch[1].trim() : '',
        assigneeId: assigneeIdMatch ? assigneeIdMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim() : description
      };
    }
    
    // If assigneeName is provided but assigneeId is not, try to find the ID
    if (refinedData.assigneeName && !refinedData.assigneeId && teamMembers) {
      const assignee = teamMembers.find((member: any) => 
        member.name.toLowerCase() === refinedData.assigneeName.toLowerCase()
      );
      
      if (assignee) {
        console.log(`Found team member ID for ${refinedData.assigneeName}: ${assignee.id}`);
        refinedData.assigneeId = assignee.id;
      } else {
        console.log(`Could not find team member ID for ${refinedData.assigneeName}`);
      }
    }

    console.log('Refined data:', refinedData);
    return NextResponse.json(refinedData);
  } catch (error: any) {
    console.error('Error refining task:', error);
    return NextResponse.json(
      { error: error.message || "Failed to refine task" },
      { status: 500 }
    );
  }
}

// Helper function to determine issue type based on description
function determineIssueType(description: string, currentType: string): string {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes("bug") || lowerDesc.includes("fix") || lowerDesc.includes("issue") || lowerDesc.includes("problem")) {
    return "Bug";
  } else if (lowerDesc.includes("feature") || lowerDesc.includes("story") || lowerDesc.includes("enhancement")) {
    return "Story";
  }
  
  return currentType || "Task";
}

// Helper function to estimate hours based on description complexity
function estimateHours(description: string, currentEstimate: string): number {
  if (currentEstimate) {
    return parseFloat(currentEstimate);
  }
  
  const wordCount = description.split(" ").length;
  
  // Simple algorithm: 1 hour per 25 words, with min of 1 and max of 8
  const estimatedHours = Math.max(1, Math.min(8, Math.ceil(wordCount / 25)));
  
  return estimatedHours;
}

// Helper function to suggest an assignee based on task description
function suggestAssignee(description: string, teamMembers: any[]): { id: string, name: string } | null {
  if (!teamMembers || teamMembers.length === 0) {
    return null;
  }
  
  const lowerDesc = description.toLowerCase();
  
  // Check if description explicitly mentions a team member
  for (const member of teamMembers) {
    if (lowerDesc.includes(member.name.toLowerCase())) {
      return { id: member.id, name: member.name };
    }
  }
  
  // Otherwise, assign based on keywords (this is a simplistic approach)
  if (lowerDesc.includes("backend") || lowerDesc.includes("api") || lowerDesc.includes("database")) {
    // Return a backend-focused team member or the first one as fallback
    return { id: teamMembers[0].id, name: teamMembers[0].name };
  } else if (lowerDesc.includes("frontend") || lowerDesc.includes("ui") || lowerDesc.includes("design")) {
    // Return a UI-focused team member or the second one as fallback
    return teamMembers.length > 1 
      ? { id: teamMembers[1].id, name: teamMembers[1].name }
      : { id: teamMembers[0].id, name: teamMembers[0].name };
  }
  
  // No clear assignment - don't suggest anyone
  return null;
} 