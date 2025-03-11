import { FormattedJiraIssue } from "@/lib/jira";
import { TeamMember } from "@/components/SkillsContext";

export interface WorkloadResult {
  teamMember: TeamMember;
  assignedTasks: FormattedJiraIssue[];
  totalEstimatedHours: number;
  remainingCapacity: number;
  overloaded: boolean;
  atRisk: boolean;
}

// Constants for workload calculation
const HOURS_PER_DAY = 8;
const DAYS_PER_WEEK = 5;
const WEEKLY_CAPACITY = HOURS_PER_DAY * DAYS_PER_WEEK;
const OVERLOAD_THRESHOLD = 0.9; // 90% of capacity
const AT_RISK_THRESHOLD = 0.75; // 75% of capacity

/**
 * Calculates the workload for a team member based on their assigned tasks
 * @param teamMember The team member to calculate workload for
 * @param allIssues All Jira issues
 * @returns Workload result with capacity analysis
 */
export function calculateWorkload(
  teamMember: TeamMember,
  allIssues: FormattedJiraIssue[]
): WorkloadResult {
  // Find all tasks assigned to this team member
  const assignedTasks = allIssues.filter(issue => {
    // Match by email if available, otherwise by display name
    if (teamMember.emailAddress && issue.assigneeEmail) {
      return issue.assigneeEmail.toLowerCase() === teamMember.emailAddress.toLowerCase();
    }
    return issue.assignee === teamMember.displayName;
  });
  
  // Filter for tasks that are not done
  const activeTasks = assignedTasks.filter(task => 
    task.statusCategory !== "done"
  );
  
  // Calculate total estimated hours
  let totalEstimatedHours = 0;
  activeTasks.forEach(task => {
    if (task.estimatedHours) {
      totalEstimatedHours += task.estimatedHours;
    } else {
      // Default estimate for tasks without hours
      totalEstimatedHours += 4; // Assume 4 hours for unestimated tasks
    }
  });
  
  // Calculate remaining capacity
  const remainingCapacity = WEEKLY_CAPACITY - totalEstimatedHours;
  
  // Determine if overloaded or at risk
  const capacityPercentage = totalEstimatedHours / WEEKLY_CAPACITY;
  const overloaded = capacityPercentage >= OVERLOAD_THRESHOLD;
  const atRisk = capacityPercentage >= AT_RISK_THRESHOLD;
  
  return {
    teamMember,
    assignedTasks: activeTasks,
    totalEstimatedHours,
    remainingCapacity,
    overloaded,
    atRisk
  };
}

/**
 * Calculates workload for all team members
 * @param teamMembers Array of team members
 * @param allIssues All Jira issues
 * @returns Array of workload results for all team members
 */
export function calculateTeamWorkload(
  teamMembers: TeamMember[],
  allIssues: FormattedJiraIssue[]
): WorkloadResult[] {
  return teamMembers.map(member => calculateWorkload(member, allIssues));
}

/**
 * Formats the workload results into a readable string
 * @param result Workload result
 * @returns Formatted string with workload analysis
 */
export function formatWorkloadResult(result: WorkloadResult): string {
  const capacityPercentage = Math.round((result.totalEstimatedHours / WEEKLY_CAPACITY) * 100);
  
  let statusIndicator = "🟢"; // Green for available
  if (result.overloaded) {
    statusIndicator = "🔴"; // Red for overloaded
  } else if (result.atRisk) {
    statusIndicator = "🟠"; // Orange for at risk
  }
  
  let output = `${statusIndicator} ${result.teamMember.displayName}\n`;
  output += `Current workload: ${result.totalEstimatedHours} hours (${capacityPercentage}% of capacity)\n`;
  output += `Remaining capacity: ${result.remainingCapacity} hours\n`;
  
  if (result.assignedTasks.length > 0) {
    output += `\nAssigned tasks:\n`;
    result.assignedTasks.forEach(task => {
      const hours = task.estimatedHours || "unestimated";
      output += `- ${task.key}: ${task.summary} (${hours} hours, ${task.statusCategory})\n`;
    });
  } else {
    output += `\nNo active tasks assigned.`;
  }
  
  return output;
}

/**
 * Identifies team members who are likely to miss deadlines
 * @param workloads Array of workload results
 * @returns Array of team members at risk of missing deadlines
 */
export function identifyAtRiskMembers(workloads: WorkloadResult[]): WorkloadResult[] {
  return workloads.filter(result => result.overloaded || result.atRisk);
} 