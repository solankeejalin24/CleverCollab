"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { saveSkillsToFile, loadSkillsFromFile } from "@/app/actions/skills"
import { toast } from "sonner"

export type TeamMember = {
  id: string
  accountId: string
  displayName: string
  emailAddress?: string
}

export type Skill = {
  id: string
  name: string
  category: string
  teamMemberId?: string
  teamMemberName?: string
}

type SkillsContextType = {
  skills: Skill[]
  teamMembers: TeamMember[]
  addSkill: (skill: Omit<Skill, "id">) => void
  removeSkill: (id: string) => void
  isSkillsModalOpen: boolean
  openSkillsModal: () => void
  closeSkillsModal: () => void
  fetchTeamMembers: () => void
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined)

// Common software skills for quick selection
export const commonSkills = [
  { name: "JavaScript", category: "Programming Language" },
  { name: "TypeScript", category: "Programming Language" },
  { name: "React", category: "Framework" },
  { name: "Next.js", category: "Framework" },
  { name: "Node.js", category: "Runtime" },
  { name: "Python", category: "Programming Language" },
  { name: "Java", category: "Programming Language" },
  { name: "C#", category: "Programming Language" },
  { name: "HTML", category: "Markup" },
  { name: "CSS", category: "Styling" },
  { name: "Tailwind CSS", category: "Styling" },
  { name: "SQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "Git", category: "Version Control" },
  { name: "Docker", category: "DevOps" },
  { name: "AWS", category: "Cloud" },
  { name: "Azure", category: "Cloud" },
  { name: "Google Cloud", category: "Cloud" },
  { name: "Figma", category: "Design" },
  { name: "Photoshop", category: "Design" },
]

export function SkillsProvider({ children }: { children: ReactNode }) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [issues, setIssues] = useState<any[]>([])

  // Load skills from file on initial render
  useEffect(() => {
    const loadSkills = async () => {
      try {
        // First try to load from localStorage for immediate display
        const savedSkills = localStorage.getItem("userSkills")
        if (savedSkills) {
          setSkills(JSON.parse(savedSkills))
        }

        // Then try to load from file (server)
        const result = await loadSkillsFromFile()
        if (result.success && result.skills.length > 0) {
          setSkills(result.skills)
          // Update localStorage with the server data
          localStorage.setItem("userSkills", JSON.stringify(result.skills))
        }
      } catch (error) {
        console.error("Failed to load skills:", error)
      } finally {
        setIsInitialized(true)
      }
    }

    loadSkills()
    // Don't call fetchTeamMembers here to avoid infinite loops
  }, [])

  // Fetch Jira issues only once when needed
  const fetchJiraIssues = useCallback(async () => {
    try {
      // Only fetch if we don't already have issues
      if (issues.length === 0) {
        const response = await fetch('/api/jira?jql=issuetype in (Story, Task, Bug)')
        const data = await response.json()

        if (data.success) {
          setIssues(data.data)
          console.log('Fetched Jira issues for team member extraction:', data.data.length)
        } else {
          console.error('Failed to fetch Jira issues:', data.error)
        }
      }
    } catch (error) {
      console.error('Error fetching Jira issues:', error)
    }
  }, [issues.length])

  // Extract team members from issues
  const fetchTeamMembers = useCallback(() => {
    // If we already have team members, don't fetch again
    if (teamMembers.length > 0) {
      console.log('Using existing team members:', teamMembers.length)
      return
    }

    // First try to extract from existing issues
    if (issues.length > 0) {
      extractTeamMembersFromIssues()
    } else {
      // If no issues, fetch them first
      fetchJiraIssues()
    }
  }, [teamMembers.length, issues.length, fetchJiraIssues])

  // Extract team members from issues whenever issues change
  useEffect(() => {
    if (issues.length > 0) {
      extractTeamMembersFromIssues()
    }
  }, [issues])

  // Function to extract unique team members from issues
  const extractTeamMembersFromIssues = () => {
    const uniqueMembers = new Map<string, TeamMember>()

    issues.forEach(issue => {
      if (issue.assigneeAccountId && issue.assignee && issue.assignee !== 'Unassigned') {
        uniqueMembers.set(issue.assigneeAccountId, {
          id: issue.assigneeAccountId,
          accountId: issue.assigneeAccountId,
          displayName: issue.assignee,
          emailAddress: issue.assigneeEmail
        })
      }
    })

    const extractedMembers = Array.from(uniqueMembers.values())
    console.log('Extracted team members from issues:', extractedMembers.length)
    setTeamMembers(extractedMembers)
  }

  // Save skills to localStorage and file whenever they change
  useEffect(() => {
    if (!isInitialized) return

    // Save to localStorage
    localStorage.setItem("userSkills", JSON.stringify(skills))

    // Save to file (server)
    const saveToFile = async () => {
      try {
        await saveSkillsToFile(skills)
      } catch (error) {
        console.error("Failed to save skills to file:", error)
        toast.error("Failed to save skills to file")
      }
    }

    saveToFile()
  }, [skills, isInitialized, toast])

  const addSkill = (skill: Omit<Skill, "id">) => {
    // Check if skill already exists for the same team member
    const exists = skills.some(
      (s) =>
        s.name.toLowerCase() === skill.name.toLowerCase() && 
        s.category.toLowerCase() === skill.category.toLowerCase() &&
        (
          // Both are unassigned
          (!s.teamMemberId && !skill.teamMemberId) ||
          // Both are assigned to the same team member
          (s.teamMemberId === skill.teamMemberId)
        )
    )

    if (!exists) {
      // If a team member is selected, make sure we have their information
      if (skill.teamMemberId) {
        const teamMember = teamMembers.find(tm => tm.id === skill.teamMemberId);
        if (teamMember) {
          // Ensure we store the team member's name and account ID
          setSkills((prev) => [...prev, { 
            ...skill, 
            id: Date.now().toString(),
            teamMemberId: teamMember.accountId,
            teamMemberName: teamMember.displayName
          }]);
          return;
        }
      }
      
      // If no team member or team member not found, just add the skill
      setSkills((prev) => [...prev, { ...skill, id: Date.now().toString() }]);
    }
  }

  const removeSkill = (id: string) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== id))
  }

  const openSkillsModal = () => setIsSkillsModalOpen(true)
  const closeSkillsModal = () => setIsSkillsModalOpen(false)

  return (
    <SkillsContext.Provider
      value={{
        skills,
        teamMembers,
        addSkill,
        removeSkill,
        isSkillsModalOpen,
        openSkillsModal,
        closeSkillsModal,
        fetchTeamMembers,
      }}
    >
      {children}
    </SkillsContext.Provider>
  )
}

export function useSkills() {
  const context = useContext(SkillsContext)
  if (context === undefined) {
    throw new Error("useSkills must be used within a SkillsProvider")
  }
  return context
}

