"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { saveSkillsToFile, loadSkillsFromFile } from "@/app/actions/skills"
import { toast } from "sonner"

export type Skill = {
  id: string
  name: string
  category: string
}

type SkillsContextType = {
  skills: Skill[]
  addSkill: (skill: Omit<Skill, "id">) => void
  removeSkill: (id: string) => void
  isSkillsModalOpen: boolean
  openSkillsModal: () => void
  closeSkillsModal: () => void
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
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

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
  }, [])

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
        toast.error("Error", {
          description: "Failed to save skills to file",
        })
      }
    }

    saveToFile()
  }, [skills, isInitialized, toast])

  const addSkill = (skill: Omit<Skill, "id">) => {
    // Check if skill already exists
    const exists = skills.some(
      (s) =>
        s.name.toLowerCase() === skill.name.toLowerCase() && s.category.toLowerCase() === skill.category.toLowerCase(),
    )

    if (!exists) {
      setSkills((prev) => [...prev, { ...skill, id: Date.now().toString() }])
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
        addSkill,
        removeSkill,
        isSkillsModalOpen,
        openSkillsModal,
        closeSkillsModal,
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

