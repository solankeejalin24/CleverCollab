import { Skill, TeamMember } from "@/components/SkillsContext";

export interface SkillMatchResult {
  teamMember: TeamMember;
  matchedSkills: string[];
  matchScore: number;
}

/**
 * Finds team members with specific skills
 * @param skills Array of skills to match
 * @param allSkills All skills in the system
 * @param teamMembers All team members
 * @returns Array of team members sorted by match score
 */
export function findSkillMatches(
  skills: string[],
  allSkills: Skill[],
  teamMembers: TeamMember[]
): SkillMatchResult[] {
  // Normalize skills for case-insensitive matching
  const normalizedSkills = skills.map(s => s.toLowerCase());
  
  // Create a map of team member IDs to their skills
  const teamMemberSkills: Record<string, Set<string>> = {};
  
  // Populate the map with skills for each team member
  allSkills.forEach(skill => {
    if (skill.teamMemberId) {
      if (!teamMemberSkills[skill.teamMemberId]) {
        teamMemberSkills[skill.teamMemberId] = new Set();
      }
      teamMemberSkills[skill.teamMemberId].add(skill.name.toLowerCase());
    }
  });
  
  // Calculate match scores for each team member
  const results: SkillMatchResult[] = teamMembers
    .filter(member => teamMemberSkills[member.id])
    .map(member => {
      const memberSkills = teamMemberSkills[member.id];
      const matchedSkills = normalizedSkills.filter(skill => 
        memberSkills.has(skill)
      );
      
      return {
        teamMember: member,
        matchedSkills: matchedSkills,
        matchScore: matchedSkills.length / normalizedSkills.length
      };
    })
    .filter(result => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
  
  return results;
}

/**
 * Formats the skill match results into a readable string
 * @param results Skill match results
 * @returns Formatted string with match results
 */
export function formatSkillMatchResults(results: SkillMatchResult[]): string {
  if (results.length === 0) {
    return "No team members found with the requested skills.";
  }
  
  return results
    .map(result => {
      const percentage = Math.round(result.matchScore * 100);
      return `${result.teamMember.displayName} (${percentage}% match): Matched skills: ${result.matchedSkills.join(", ")}`;
    })
    .join("\n");
} 