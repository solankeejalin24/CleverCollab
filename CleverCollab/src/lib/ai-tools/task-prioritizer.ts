import { FormattedJiraIssue } from "@/lib/jira";

export type PriorityLevel = "High" | "Medium" | "Low";

export interface PriorityResult {
  issue: FormattedJiraIssue;
  priorityLevel: PriorityLevel;
  score: number;
  reasoning: string;
}

/**
 * Calculates the priority score for a task based on various factors
 * @param issue The Jira issue to prioritize
 * @param allIssues All Jira issues for context
 * @returns Priority result with score and reasoning
 */
export function calculateTaskPriority(
  issue: FormattedJiraIssue,
  allIssues: FormattedJiraIssue[]
): PriorityResult {
  let score = 0;
  const reasons: string[] = [];
  
  // Factor 1: Due date proximity
  if (issue.dueDate) {
    const dueDate = new Date(issue.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      // Overdue tasks get highest priority
      score += 50;
      reasons.push(`Task is overdue by ${Math.abs(daysUntilDue)} days`);
    } else if (daysUntilDue <= 2) {
      // Due within 2 days
      score += 40;
      reasons.push(`Due very soon (${daysUntilDue} days)`);
    } else if (daysUntilDue <= 7) {
      // Due within a week
      score += 30;
      reasons.push(`Due within a week (${daysUntilDue} days)`);
    } else if (daysUntilDue <= 14) {
      // Due within two weeks
      score += 20;
      reasons.push(`Due within two weeks (${daysUntilDue} days)`);
    } else {
      // Due later
      score += 10;
      reasons.push(`Due in ${daysUntilDue} days`);
    }
  } else {
    // No due date
    score += 5;
    reasons.push("No due date specified");
  }
  
  // Factor 2: Issue type
  if (issue.issueType.toLowerCase().includes("bug")) {
    score += 15;
    reasons.push("Bug issues typically need faster resolution");
  } else if (issue.issueType.toLowerCase().includes("story")) {
    score += 10;
    reasons.push("User stories are core deliverables");
  }
  
  // Factor 3: Dependencies
  if (issue.parent && issue.parent !== "No Parent") {
    // Check if parent task is already completed
    const parentIssue = allIssues.find(i => i.key === issue.parent);
    if (parentIssue && parentIssue.statusCategory !== "done") {
      score += 15;
      reasons.push("Has dependencies on incomplete parent tasks");
    }
  }
  
  // Check if this task is a parent of other tasks
  const childIssues = allIssues.filter(i => i.parent === issue.key);
  if (childIssues.length > 0) {
    score += 15;
    reasons.push(`Is a blocker for ${childIssues.length} other tasks`);
  }
  
  // Factor 4: Estimated effort
  if (issue.estimatedHours) {
    if (issue.estimatedHours > 20) {
      score += 15;
      reasons.push(`Large task (${issue.estimatedHours} hours) that needs early start`);
    } else if (issue.estimatedHours > 8) {
      score += 10;
      reasons.push(`Medium-sized task (${issue.estimatedHours} hours)`);
    }
  }
  
  // Determine priority level based on score
  let priorityLevel: PriorityLevel;
  if (score >= 50) {
    priorityLevel = "High";
  } else if (score >= 30) {
    priorityLevel = "Medium";
  } else {
    priorityLevel = "Low";
  }
  
  return {
    issue,
    priorityLevel,
    score,
    reasoning: reasons.join(". ")
  };
}

/**
 * Prioritizes multiple tasks and returns them in order of priority
 * @param issues Array of Jira issues to prioritize
 * @returns Array of priority results sorted by priority score
 */
export function prioritizeTasks(issues: FormattedJiraIssue[]): PriorityResult[] {
  return issues
    .map(issue => calculateTaskPriority(issue, issues))
    .sort((a, b) => b.score - a.score);
}

/**
 * Formats the priority results into a readable string
 * @param results Priority results
 * @returns Formatted string with priority results
 */
export function formatPriorityResults(results: PriorityResult[]): string {
  if (results.length === 0) {
    return "No tasks to prioritize.";
  }
  
  return results
    .map(result => {
      return `${result.issue.key}: ${result.issue.summary} - ${result.priorityLevel} Priority\nReasoning: ${result.reasoning}`;
    })
    .join("\n\n");
} 