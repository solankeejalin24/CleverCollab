"use client"

import { useState, useEffect } from "react"
import { X, Plus, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSkills, commonSkills } from "./SkillsContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SkillsModal() {
  const { skills, teamMembers, addSkill, removeSkill, isSkillsModalOpen, closeSkillsModal, fetchTeamMembers } =
    useSkills()
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillCategory, setNewSkillCategory] = useState("Other")
  const [selectedCommonSkill, setSelectedCommonSkill] = useState("")
  const [selectedTeamMember, setSelectedTeamMember] = useState("unassigned")

  // Fetch team members when modal opens
  useEffect(() => {
    if (isSkillsModalOpen) {
      // Only fetch team members once when the modal opens
      fetchTeamMembers()
    }
  }, [isSkillsModalOpen, fetchTeamMembers])

  const handleAddManualSkill = () => {
    if (newSkillName.trim()) {
      const teamMember =
        selectedTeamMember !== "unassigned" ? teamMembers.find((tm) => tm.id === selectedTeamMember) : undefined

      addSkill({
        name: newSkillName.trim(),
        category: newSkillCategory,
        teamMemberId: selectedTeamMember !== "unassigned" ? selectedTeamMember : undefined,
        teamMemberName: teamMember?.displayName,
      })

      toast.success(`Added skill: ${newSkillName}${teamMember ? ` for ${teamMember.displayName}` : ""}`)

      setNewSkillName("")
    }
  }

  const handleAddCommonSkill = () => {
    if (selectedCommonSkill) {
      const skill = commonSkills.find((s) => s.name === selectedCommonSkill)
      const teamMember =
        selectedTeamMember !== "unassigned" ? teamMembers.find((tm) => tm.id === selectedTeamMember) : undefined

      if (skill) {
        addSkill({
          name: skill.name,
          category: skill.category,
          teamMemberId: selectedTeamMember !== "unassigned" ? selectedTeamMember : undefined,
          teamMemberName: teamMember?.displayName,
        })

        toast(`Added skill: ${skill.name}${teamMember ? ` for ${teamMember.displayName}` : ""}`)

        setSelectedCommonSkill("")
      }
    }
  }

  const handleRemoveSkill = (id: string, name: string, teamMemberName?: string) => {
    removeSkill(id)

    toast(`Removed skill: ${name}${teamMemberName ? ` for ${teamMemberName}` : ""}`)
  }

  // Group skills by team member
  const skillsByTeamMember = skills.reduce(
    (acc, skill) => {
      const key = skill.teamMemberId || "unassigned"
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(skill)
      return acc
    },
    {} as Record<string, typeof skills>,
  )

  return (
    <Dialog open={isSkillsModalOpen} onOpenChange={closeSkillsModal}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Skills</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Team Member</h3>
            <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.displayName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-members" disabled>
                    No team members found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {teamMembers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Note: Team members are extracted from Jira issues. Assign issues to team members in Jira to see them
                here.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Add Skill Manually</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  placeholder="Enter skill name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
              </div>
              <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Programming Language">Programming Language</SelectItem>
                  <SelectItem value="Framework">Framework</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="Cloud">Cloud</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddManualSkill} disabled={!newSkillName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Quick Add Common Skills</h3>
            <div className="flex gap-2">
              <Select value={selectedCommonSkill} onValueChange={setSelectedCommonSkill}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a common skill" />
                </SelectTrigger>
                <SelectContent>
                  {commonSkills.map((skill) => (
                    <SelectItem key={skill.name} value={skill.name}>
                      {skill.name} ({skill.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddCommonSkill} disabled={!selectedCommonSkill}>
                Add
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Team Skills</h3>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="all">All Skills</TabsTrigger>
                <TabsTrigger value="byMember">By Team Member</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No skills added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-1">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
                          {skill.name}
                          {skill.teamMemberName && (
                            <span className="text-xs text-muted-foreground ml-1">({skill.teamMemberName})</span>
                          )}
                          <button
                            onClick={() => handleRemoveSkill(skill.id, skill.name, skill.teamMemberName)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            aria-label={`Remove ${skill.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="byMember">
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {Object.keys(skillsByTeamMember).length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No skills added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(skillsByTeamMember).map(([memberId, memberSkills]) => {
                        const memberName =
                          memberId === "unassigned"
                            ? "Unassigned"
                            : teamMembers.find((m) => m.id === memberId)?.displayName || "Unknown Member"

                        return (
                          <div key={memberId} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <h4 className="text-sm font-medium">{memberName}</h4>
                            </div>
                            <div className="flex flex-wrap gap-2 pl-6">
                              {memberSkills.map((skill) => (
                                <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
                                  {skill.name}
                                  <button
                                    onClick={() => handleRemoveSkill(skill.id, skill.name, skill.teamMemberName)}
                                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                                    aria-label={`Remove ${skill.name}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

