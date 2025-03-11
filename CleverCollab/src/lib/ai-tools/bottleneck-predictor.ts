import { FormattedJiraIssue } from "@/lib/jira";
import { TeamMember } from "@/components/SkillsContext";
import { WorkloadResult } from "./workload-calculator";

export interface BottleneckRisk {
  type: 'resource' | 'dependency' | 'deadline' | 'skill';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedIssues: FormattedJiraIssue[];
  affectedMembers?: TeamMember[];
  recommendation: string;
}

/**
 * Identifies resource bottlenecks (overloaded team members)
 * @param workloads Workload results for team members
 * @param allIssues All Jira issues
 * @returns Array of bottleneck risks related to resources
 */
function identifyResourceBottlenecks(
  workloads: WorkloadResult[],
  allIssues: FormattedJiraIssue[]
): BottleneckRisk[] {
  const risks: BottleneckRisk[] = [];
  
  // Find overloaded team members
  const overloadedMembers = workloads.filter(result => result.overloaded);
  
  if (overloadedMembers.length > 0) {
    overloadedMembers.forEach(member => {
      const severity = member.totalEstimatedHours > 60 ? 'high' : 'medium';
      
      risks.push({
        type: 'resource',
        severity,
        description: `${member.teamMember.displayName} is overloaded with ${member.totalEstimatedHours} hours of work`,
        affectedIssues: member.assignedTasks,
        affectedMembers: [member.teamMember],
        recommendation: `Redistribute ${Math.round(member.totalEstimatedHours - 40)} hours of work to other team members or extend deadlines`
      });
    });
  }
  
  return risks;
}

/**
 * Identifies dependency bottlenecks (blocked tasks)
 * @param allIssues All Jira issues
 * @returns Array of bottleneck risks related to dependencies
 */
function identifyDependencyBottlenecks(
  allIssues: FormattedJiraIssue[]
): BottleneckRisk[] {
  const risks: BottleneckRisk[] = [];
  const dependencyMap = new Map<string, FormattedJiraIssue[]>();
  
  // Build dependency map
  allIssues.forEach(issue => {
    if (issue.parent && issue.parent !== "No Parent") {
      if (!dependencyMap.has(issue.parent)) {
        dependencyMap.set(issue.parent, []);
      }
      dependencyMap.get(issue.parent)?.push(issue);
    }
  });
  
  // Find blocked tasks
  dependencyMap.forEach((childIssues, parentKey) => {
    const parentIssue = allIssues.find(issue => issue.key === parentKey);
    
    if (parentIssue && parentIssue.statusCategory !== 'done') {
      // Parent is not done, so children are blocked
      const blockedIssues = childIssues.filter(issue => issue.statusCategory !== 'done');
      
      if (blockedIssues.length > 0) {
        risks.push({
          type: 'dependency',
          severity: blockedIssues.length > 3 ? 'high' : 'medium',
          description: `${blockedIssues.length} tasks are blocked by parent task ${parentKey}`,
          affectedIssues: [parentIssue, ...blockedIssues],
          recommendation: `Prioritize completion of task ${parentKey} to unblock dependent tasks`
        });
      }
    }
  });
  
  return risks;
}

/**
 * Identifies deadline bottlenecks (tasks at risk of missing deadlines)
 * @param allIssues All Jira issues
 * @returns Array of bottleneck risks related to deadlines
 */
function identifyDeadlineBottlenecks(
  allIssues: FormattedJiraIssue[]
): BottleneckRisk[] {
  const risks: BottleneckRisk[] = [];
  const today = new Date();
  
  // Find tasks with approaching deadlines
  const tasksWithDeadlines = allIssues.filter(issue => 
    issue.dueDate && issue.statusCategory !== 'done'
  );
  
  tasksWithDeadlines.forEach(issue => {
    const dueDate = new Date(issue.dueDate!);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      // Overdue tasks
      risks.push({
        type: 'deadline',
        severity: 'high',
        description: `Task ${issue.key} is overdue by ${Math.abs(daysUntilDue)} days`,
        affectedIssues: [issue],
        recommendation: `Immediately address the overdue task or renegotiate the deadline`
      });
    } else if (daysUntilDue <= 3) {
      // Tasks due very soon
      risks.push({
        type: 'deadline',
        severity: 'medium',
        description: `Task ${issue.key} is due in ${daysUntilDue} days`,
        affectedIssues: [issue],
        recommendation: `Ensure resources are allocated to complete this task on time`
      });
    }
  });
  
  return risks;
}

/**
 * Predicts bottlenecks in project timelines
 * @param allIssues All Jira issues
 * @param teamMembers All team members
 * @param workloads Workload results for team members
 * @returns Array of bottleneck risks
 */
export function predictBottlenecks(
  allIssues: FormattedJiraIssue[],
  teamMembers: TeamMember[],
  workloads: WorkloadResult[]
): BottleneckRisk[] {
  const resourceRisks = identifyResourceBottlenecks(workloads, allIssues);
  const dependencyRisks = identifyDependencyBottlenecks(allIssues);
  const deadlineRisks = identifyDeadlineBottlenecks(allIssues);
  
  // Combine all risks and sort by severity
  const allRisks = [...resourceRisks, ...dependencyRisks, ...deadlineRisks];
  
  // Sort by severity (high to low)
  return allRisks.sort((a, b) => {
    const severityScore = { 'high': 3, 'medium': 2, 'low': 1 };
    return severityScore[b.severity] - severityScore[a.severity];
  });
}

/**
 * Formats the bottleneck risks into a readable string
 * @param risks Array of bottleneck risks
 * @returns Formatted string with bottleneck analysis
 */
export function formatBottleneckRisks(risks: BottleneckRisk[]): string {
  if (risks.length === 0) {
    return "No significant bottlenecks detected in the project timeline.";
  }
  
  const severityEmoji = {
    'high': '🔴',
    'medium': '🟠',
    'low': '🟡'
  };
  
  let output = `Identified ${risks.length} potential bottlenecks:\n\n`;
  
  risks.forEach((risk, index) => {
    output += `${severityEmoji[risk.severity]} Bottleneck ${index + 1}: ${risk.description}\n`;
    output += `Type: ${risk.type.charAt(0).toUpperCase() + risk.type.slice(1)} bottleneck\n`;
    output += `Severity: ${risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}\n`;
    output += `Affected issues: ${risk.affectedIssues.map(i => i.key).join(', ')}\n`;
    
    if (risk.affectedMembers && risk.affectedMembers.length > 0) {
      output += `Affected team members: ${risk.affectedMembers.map(m => m.displayName).join(', ')}\n`;
    }
    
    output += `Recommendation: ${risk.recommendation}\n\n`;
  });
  
  return output;
} 