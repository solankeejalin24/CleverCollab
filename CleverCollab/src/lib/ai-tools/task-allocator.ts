import { FormattedJiraIssue } from "@/lib/jira";
import { TeamMember } from "@/components/SkillsContext";
import { findSkillMatches, SkillMatchResult } from "./skill-matcher";
import { calculateWorkload, WorkloadResult } from "./workload-calculator";
import { Skill } from "@/components/SkillsContext";

export interface AllocationResult {
  issue: FormattedJiraIssue;
  recommendedAssignee: TeamMember;
  skillMatch: SkillMatchResult;
  workload: WorkloadResult;
  confidence: number;
  reasoning: string;
}

/**
 * Extracts skills from a task description and summary
 * @param issue The Jira issue to extract skills from
 * @param allSkills All skills in the system for reference
 * @returns Array of extracted skills
 */
export function extractSkillsFromTask(
  issue: FormattedJiraIssue,
  allSkills: Skill[]
): string[] {
  // Get all skill names for reference
  const skillNames = allSkills.map(skill => skill.name.toLowerCase());
  
  // Combine summary and description for analysis
  const text = `${issue.summary} ${issue.description || ""}`.toLowerCase();
  
  // Extract skills that appear in the text
  const extractedSkills = skillNames.filter(skillName => 
    text.includes(skillName.toLowerCase())
  );
  
  // If no skills were found, try to infer from issue type
  if (extractedSkills.length === 0) {
    if (issue.issueType.toLowerCase().includes("frontend") || 
        text.includes("ui") || 
        text.includes("interface") || 
        text.includes("design")) {
      extractedSkills.push("react", "javascript", "typescript", "html", "css");
    } else if (issue.issueType.toLowerCase().includes("backend") || 
               text.includes("api") || 
               text.includes("server") || 
               text.includes("database")) {
      extractedSkills.push("node.js", "express", "api", "database");
    } else if (issue.issueType.toLowerCase().includes("bug")) {
      // For bugs, include a wider range of skills
      extractedSkills.push("debugging", "testing");
    }
  }
  
  return Array.from(new Set(extractedSkills)); // Remove duplicates and convert to array
}

/**
 * Allocates a task to the most suitable team member
 * @param issue The Jira issue to allocate
 * @param teamMembers All team members
 * @param allIssues All Jira issues for context
 * @param allSkills All skills in the system
 * @returns Allocation result with recommended assignee
 */
export function allocateTask(
  issue: FormattedJiraIssue,
  teamMembers: TeamMember[],
  allIssues: FormattedJiraIssue[],
  allSkills: Skill[]
): AllocationResult | null {
  // Extract skills needed for the task
  const requiredSkills = extractSkillsFromTask(issue, allSkills);
  
  if (requiredSkills.length === 0) {
    return null; // Cannot allocate without skills
  }
  
  // Find team members with matching skills
  const skillMatches = findSkillMatches(requiredSkills, allSkills, teamMembers);
  
  if (skillMatches.length === 0) {
    return null; // No matching team members
  }
  
  // Calculate workload for each matching team member
  const workloads = skillMatches.map(match => 
    calculateWorkload(match.teamMember, allIssues)
  );
  
  // Score each potential assignee based on skill match and workload
  const candidates = skillMatches.map((match, index) => {
    const workload = workloads[index];
    
    // Calculate a confidence score (0-100)
    // 70% weight on skill match, 30% weight on available capacity
    const skillScore = match.matchScore * 70;
    
    // Capacity score is higher when workload is lower
    const capacityPercentage = workload.totalEstimatedHours / 40; // 40 hours per week
    const capacityScore = Math.max(0, (1 - capacityPercentage)) * 30;
    
    const confidence = skillScore + capacityScore;
    
    // Generate reasoning
    const reasons = [
      `Skill match: ${Math.round(match.matchScore * 100)}% (matched ${match.matchedSkills.length} of ${requiredSkills.length} required skills)`,
      `Current workload: ${workload.totalEstimatedHours} hours (${Math.round(capacityPercentage * 100)}% capacity)`
    ];
    
    if (workload.overloaded) {
      reasons.push("Warning: Team member is already overloaded");
    } else if (workload.atRisk) {
      reasons.push("Caution: Team member is approaching capacity");
    }
    
    return {
      issue,
      recommendedAssignee: match.teamMember,
      skillMatch: match,
      workload,
      confidence,
      reasoning: reasons.join(". ")
    };
  });
  
  // Sort by confidence score (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);
  
  return candidates[0]; // Return the best candidate
}

/**
 * Allocates multiple tasks to team members
 * @param issues Array of Jira issues to allocate
 * @param teamMembers All team members
 * @param allSkills All skills in the system
 * @returns Array of allocation results
 */
export function allocateTasks(
  issues: FormattedJiraIssue[],
  teamMembers: TeamMember[],
  allSkills: Skill[]
): AllocationResult[] {
  const results: AllocationResult[] = [];
  
  // Make a copy of issues to avoid modifying the original
  const remainingIssues = [...issues];
  
  // Allocate tasks one by one, updating workloads after each allocation
  while (remainingIssues.length > 0) {
    const issue = remainingIssues.shift();
    if (!issue) break;
    
    const allocation = allocateTask(issue, teamMembers, issues, allSkills);
    if (allocation) {
      results.push(allocation);
    }
  }
  
  return results;
}

/**
 * Formats the allocation results into a readable string
 * @param result Allocation result
 * @returns Formatted string with allocation recommendation
 */
export function formatAllocationResult(result: AllocationResult): string {
  return `Task: ${result.issue.key} - ${result.issue.summary}
Recommended assignee: ${result.recommendedAssignee.displayName}
Confidence: ${Math.round(result.confidence)}%
Reasoning: ${result.reasoning}`;
} 