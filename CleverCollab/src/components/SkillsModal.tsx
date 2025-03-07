"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSkills, commonSkills } from "./SkillsContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export function SkillsModal() {
  const { skills, addSkill, removeSkill, isSkillsModalOpen, closeSkillsModal } = useSkills()
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillCategory, setNewSkillCategory] = useState("Other")
  const [selectedCommonSkill, setSelectedCommonSkill] = useState("")

  const handleAddManualSkill = () => {
    if (newSkillName.trim()) {
      addSkill({
        name: newSkillName.trim(),
        category: newSkillCategory,
      })

      toast.success(`Added skill: ${newSkillName}`)

      setNewSkillName("")
    }
  }

  const handleAddCommonSkill = () => {
    if (selectedCommonSkill) {
      const skill = commonSkills.find((s) => s.name === selectedCommonSkill)
      if (skill) {
        addSkill(skill)

        toast(`Added skill: ${skill.name}`)

        setSelectedCommonSkill("")
      }
    }
  }

  const handleRemoveSkill = (id: string, name: string) => {
    removeSkill(id)

    toast(`Removed skill: ${name}`)
  }

  return (
    <Dialog open={isSkillsModalOpen} onOpenChange={closeSkillsModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Skills</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
            <h3 className="text-sm font-medium">Your Skills</h3>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 p-1">
                  {skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
                      {skill.name}
                      <button
                        onClick={() => handleRemoveSkill(skill.id, skill.name)}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

