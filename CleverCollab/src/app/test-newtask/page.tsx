"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
}

interface TaskFormData {
  summary: string
  description: string
  issueType: string
  assignee: string
  assigneeName: string
  startDate: string
  dueDate: string
  estimatedHours: string
  projectKey: string
}

export default function TestNewTaskPage() {
  const [formData, setFormData] = useState<TaskFormData>({
    summary: "",
    description: "",
    issueType: "Task",
    assignee: "",
    assigneeName: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    estimatedHours: "",
    projectKey: "PN2"
  })

  const [loading, setLoading] = useState(false)
  const [aiRefining, setAiRefining] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Fetch team members on component mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch("/api/team-members")
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data)
        } else {
          console.error("Failed to fetch team members")
          // Fallback to hardcoded team members if API fails
          setTeamMembers([
            { id: "712020:f15989c0-31c3-4d67-9f58-4195acb97ddc", name: "Arya", email: "arya.narke@gmail.com" },
            { id: "712020:0d5fd58b-1b1e-42e5-bda4-4499281a6249", name: "Varad Parte", email: "partevr@mail.uc.edu" },
            { id: "61539e9d9cdb93007221a33c", name: "Daksh Prajapati", email: "prajapdh@mail.uc.edu" },
            { id: "62bbca19ec4c0d377f9fa23a", name: "Jalin Solankee", email: "solankjp@mail.uc.edu" }
          ])
        }
      } catch (error) {
        console.error("Error fetching team members:", error)
        // Fallback to hardcoded team members if API fails
        setTeamMembers([
          { id: "712020:f15989c0-31c3-4d67-9f58-4195acb97ddc", name: "Arya", email: "arya.narke@gmail.com" },
          { id: "712020:0d5fd58b-1b1e-42e5-bda4-4499281a6249", name: "Varad Parte", email: "partevr@mail.uc.edu" },
          { id: "61539e9d9cdb93007221a33c", name: "Daksh Prajapati", email: "prajapdh@mail.uc.edu" },
          { id: "62bbca19ec4c0d377f9fa23a", name: "Jalin Solankee", email: "solankjp@mail.uc.edu" }
        ])
      }
    }

    fetchTeamMembers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAssigneeChange = (name: string, value: string) => {
    const selectedMember = teamMembers.find(member => member.name === value);
    if (selectedMember) {
      console.log(`Selected team member: ${selectedMember.name}, ID: ${selectedMember.id}, Email: ${selectedMember.email}`);
      setFormData(prev => ({ 
        ...prev, 
        assigneeName: value,
        assignee: selectedMember.id // Always use the ID from team_members.json
      }))
    } else {
      console.log(`No team member found with name: ${value}`);
      setFormData(prev => ({ 
        ...prev, 
        assigneeName: value,
        assignee: '' 
      }))
    }
  }

  // Function to calculate due date based on start date and estimated hours
  const calculateDueDate = useCallback((startDate: string, estimatedHoursStr: string): string => {
    // Default to 3 days from start date if no estimated hours
    let daysToAdd = 3;
    
    // If we have estimated hours, calculate appropriate due date
    if (estimatedHoursStr) {
      const hours = parseFloat(estimatedHoursStr);
      if (!isNaN(hours)) {
        // Add 1 day per 4 hours of work, plus 1 day of buffer
        // Minimum 2 days, maximum 14 days
        daysToAdd = Math.min(14, Math.max(2, Math.ceil(hours / 4) + 1));
      }
    }
    
    // Calculate the due date
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split("T")[0];
  }, []);

  // Update due date when start date or estimated hours change
  useEffect(() => {
    if (!formData.dueDate && formData.startDate) {
      const calculatedDueDate = calculateDueDate(formData.startDate, formData.estimatedHours);
      setFormData(prev => ({
        ...prev,
        dueDate: calculatedDueDate
      }));
    }
  }, [formData.startDate, formData.estimatedHours, calculateDueDate, formData.dueDate]);

  const refineWithAI = async () => {
    if (!formData.description) {
      toast.error("Please provide a description for AI refinement")
      return
    }

    setAiRefining(true)
    try {
      // Call GPT-4o API for refinement
      const response = await fetch("/api/refine-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: formData.description,
          summary: formData.summary,
          issueType: formData.issueType,
          estimatedHours: formData.estimatedHours,
          teamMembers: teamMembers
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to refine task with AI")
      }

      const refinedData = await response.json()
      
      // Update form with AI refined data
      setFormData(prev => ({
        ...prev,
        summary: refinedData.summary || prev.summary,
        issueType: refinedData.issueType || prev.issueType,
        estimatedHours: refinedData.estimatedHours?.toString() || prev.estimatedHours,
        description: refinedData.description || prev.description,
        assigneeName: refinedData.assigneeName || prev.assigneeName,
        assignee: refinedData.assigneeId || prev.assignee
      }))

      toast.success("AI refinement complete")
    } catch (error) {
      console.error("Error refining with AI:", error)
      toast.error("Failed to refine with AI")
      
      // Fallback to simple refinement if API fails
      if (!formData.summary) {
        setFormData(prev => ({
          ...prev,
          summary: `AI Generated: ${prev.description.split(" ").slice(0, 5).join(" ")}...`
        }))
      }

      // Detect issue type from description
      if (formData.description.toLowerCase().includes("bug") || 
          formData.description.toLowerCase().includes("fix") || 
          formData.description.toLowerCase().includes("issue")) {
        setFormData(prev => ({ ...prev, issueType: "Bug" }))
      } else if (formData.description.toLowerCase().includes("story") || 
                formData.description.toLowerCase().includes("feature")) {
        setFormData(prev => ({ ...prev, issueType: "Story" }))
      }

      // Estimate hours if not provided
      if (!formData.estimatedHours) {
        const wordCount = formData.description.split(" ").length
        const estimatedHours = Math.max(1, Math.min(8, Math.ceil(wordCount / 20)))
        setFormData(prev => ({ ...prev, estimatedHours: estimatedHours.toString() }))
      }
    } finally {
      setAiRefining(false)
    }
  }

  const createTask = async () => {
    if (!formData.summary || !formData.description) {
      toast.error("Summary and description are required")
      return
    }

    setLoading(true)
    try {
      // Define the request data with proper typing
      interface RequestData {
        summary: string;
        description: string;
        issueType: string;
        startDate: string;
        dueDate: string;
        projectKey: string;
        assigneeAccountId?: string;
        estimatedHours?: number;
      }
      
      const requestData: RequestData = {
        summary: formData.summary,
        description: formData.description,
        issueType: formData.issueType,
        startDate: formData.startDate,
        dueDate: formData.dueDate || calculateDueDate(formData.startDate, formData.estimatedHours),
        projectKey: formData.projectKey
      };
      
      // Extract due date info from description if specified
      const dueDateMatch = formData.description.match(/due(?:\s+date)?(?:\s*:|\s+by|\s+on)?[\s:]+(\d{4}-\d{2}-\d{2})/i);
      if (dueDateMatch) {
        const extractedDueDate = dueDateMatch[1];
        console.log(`Extracted due date from description: ${extractedDueDate}`);
        requestData.dueDate = extractedDueDate;
      }
      
      // Remove assignee from initial task creation to avoid 400 errors
      // We'll assign in a separate step
      
      // Only add estimated hours if provided
      if (formData.estimatedHours) {
        const hours = parseFloat(formData.estimatedHours);
        if (!isNaN(hours)) {
          requestData.estimatedHours = hours;
          console.log(`Setting estimated hours: ${hours}`);
        }
      }
      
      console.log("Creating task with data:", requestData);
      
      // Remember assignee details for later if provided
      const assigneeToSet = formData.assignee ? {
        id: formData.assignee,
        name: formData.assigneeName
      } : null;
      
      if (assigneeToSet) {
        console.log(`Will assign to ${assigneeToSet.name} (${assigneeToSet.id}) after creation`);
      }

      const response = await fetch("/api/jira/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        // Build success message based on available data
        const taskKey = data.data?.key || data.data?.id || 'unknown';
        toast.success(`Task created: ${taskKey}`);
        
        // If we have a task key and assignee to set, always try to assign in a separate request
        if (assigneeToSet && taskKey !== 'unknown') {
          try {
            console.log(`Task created successfully. Now assigning ${taskKey} to ${assigneeToSet.name} (${assigneeToSet.id}) in a separate request.`);
            
            const assignResponse = await fetch("/api/jira/assign-task", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                taskKey: taskKey,
                assignee: assigneeToSet.id
              }),
            });
            
            const assignData = await assignResponse.json();
            
            if (assignData.success) {
              toast.success(`Task assigned to ${assigneeToSet.name}`);
              
              // Update the result with assignee information
              setResult({
                ...data,
                assignmentResult: assignData
              });
            } else {
              console.error("Failed to assign task:", assignData.error);
              toast.warning(`Task created but couldn't be assigned to ${assigneeToSet.name}`);
              
              // Include failed assignment in result
              setResult({
                ...data,
                assignmentError: assignData.error,
                assignmentDetails: assignData.details
              });
            }
          } catch (assignError) {
            console.error("Error assigning task:", assignError);
            toast.warning(`Task created but couldn't be assigned to ${assigneeToSet.name}`);
          }
        }
      } else {
        // Extract detailed error information if available
        const errorDetails = data.details ? JSON.stringify(data.details) : ""
        const errorMessage = data.error || "Failed to create task"
        
        console.error("Error creating task:", errorMessage, errorDetails)
        toast.error(`Failed to create task: ${errorMessage}`)
      }
    } catch (error: any) {
      console.error("Error creating task:", error)
      toast.error(`Failed to create task: ${error.message}`)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Test New Task Creation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>
              Fill in the details below to create a new task. AI will help refine your input.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary">Summary (optional)</Label>
                <Input
                  id="summary"
                  name="summary"
                  placeholder="Task summary (AI will generate if empty)"
                  value={formData.summary}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (required)</Label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  id="description"
                  name="description"
                  placeholder="Describe what needs to be done. AI will refine this."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueType">Issue Type</Label>
                  <Select 
                    value={formData.issueType} 
                    onValueChange={(value) => handleSelectChange("issueType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Task">Task</SelectItem>
                      <SelectItem value="Story">Story</SelectItem>
                      <SelectItem value="Bug">Bug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assigneeName">Assignee (optional)</Label>
                  <Select 
                    value={formData.assigneeName} 
                    onValueChange={(value) => handleAssigneeChange("assigneeName", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated if empty"
                  />
                  <span className="text-xs text-muted-foreground">
                    Auto-calculated based on estimated hours if left empty
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours (optional)</Label>
                <Input
                  id="estimatedHours"
                  name="estimatedHours"
                  type="number"
                  placeholder="AI will estimate if empty"
                  value={formData.estimatedHours}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectKey">Project Key</Label>
                <Input
                  id="projectKey"
                  name="projectKey"
                  value={formData.projectKey}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={refineWithAI}
              disabled={aiRefining || loading || !formData.description}
            >
              {aiRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                "Refine with AI"
              )}
            </Button>
            <div className="space-x-2">
              {formData.assignee && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      assignee: "",
                      assigneeName: ""
                    }))
                    toast.info("Assignee removed")
                  }}
                  disabled={loading || !formData.summary || !formData.description}
                >
                  Remove Assignee
                </Button>
              )}
              <Button 
                onClick={createTask}
                disabled={loading || !formData.summary || !formData.description}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              The result of your task creation will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No result yet. Create a task to see the response.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 