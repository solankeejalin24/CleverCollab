"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanItem } from "./KanbanItem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useJira } from "@/hooks/useJira"
import { FormattedJiraIssue } from "@/lib/jira"
import { Loader2 } from 'lucide-react'

export type Task = {
  id: string
  content: string
  key?: string
  issueType?: string
  status?: string
  assignee?: string
  assigneeAccountId?: string
  dueDate?: string
  startDate?: string
  completedDate?: string
  estimatedHours?: number
  description?: string
  parent?: string
}

export type Column = {
  id: string
  title: string
  tasks: Task[]
}

export function KanbanBoard() {
  const { issues, loading, error, fetchIssues, getIssuesByStatus } = useJira()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false)
  const [newTaskContent, setNewTaskContent] = useState("")
  const [currentColumnId, setCurrentColumnId] = useState<string | null>(null)
  const [columns, setColumns] = useState<Column[]>([])

  // Define the conversion function with useCallback to prevent unnecessary re-renders
  const convertJiraIssueToTask = useCallback((issue: FormattedJiraIssue): Task => {
    return {
      id: issue.id,
      content: issue.summary,
      key: issue.key,
      issueType: issue.issueType,
      status: issue.status,
      assignee: issue.assignee,
      assigneeAccountId: issue.assigneeAccountId,
      dueDate: issue.dueDate,
      startDate: issue.startDate,
      completedDate: issue.completedDate,
      estimatedHours: issue.estimatedHours,
      description: issue.description,
      parent: issue.parent,
    }
  }, [])

  // Fetch Jira issues when component mounts
  useEffect(() => {
    console.log("KanbanBoard: Initial fetch of issues")
    fetchIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to only run once on mount

  // Update columns when issues change
  useEffect(() => {
    if (loading) return // Don't update columns while loading
    
    console.log("KanbanBoard: Updating columns with issues")
    // Convert Jira issues to Kanban columns
    const newColumns: Column[] = [
      {
        id: "todo",
        title: "To Do",
        tasks: getIssuesByStatus("todo").map(convertJiraIssueToTask),
      },
      {
        id: "in-progress",
        title: "In Progress",
        tasks: getIssuesByStatus("in-progress").map(convertJiraIssueToTask),
      },
      {
        id: "done",
        title: "Done",
        tasks: getIssuesByStatus("done").map(convertJiraIssueToTask),
      },
    ]

    setColumns(newColumns)
  }, [issues, getIssuesByStatus, convertJiraIssueToTask, loading])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)

    // Find the task being dragged
    for (const column of columns) {
      const task = column.tasks.find((task) => task.id === active.id)
      if (task) {
        setActiveTask(task)
        break
      }
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveTask(null)
      return
    }

    // Find source and destination columns
    let sourceColumnId: string | null = null
    let destColumnId: string | null = null
    let movedTask: Task | null = null

    for (const column of columns) {
      const taskInColumn = column.tasks.find((task) => task.id === active.id)
      if (taskInColumn) {
        sourceColumnId = column.id
        movedTask = taskInColumn
      }

      if (over.id.startsWith("column-")) {
        // Dropping on a column
        if (over.id === `column-${column.id}`) {
          destColumnId = column.id
        }
      } else {
        // Dropping on a task
        if (column.tasks.some((task) => task.id === over.id)) {
          destColumnId = column.id
        }
      }
    }

    if (sourceColumnId && destColumnId && sourceColumnId !== destColumnId && movedTask) {
      // Create a copy of the columns to update the UI immediately
      const updatedColumns = columns.map((column) => {
        // Remove from source column
        if (column.id === sourceColumnId) {
          return {
            ...column,
            tasks: column.tasks.filter((task) => task.id !== active.id),
          }
        }

        // Add to destination column
        if (column.id === destColumnId) {
          return {
            ...column,
            tasks: [...column.tasks, movedTask!],
          }
        }

        return column
      })

      // Update the UI immediately
      setColumns(updatedColumns)

      // Show loading toast
      const toastId = toast.loading(`Moving task from ${sourceColumnId} to ${destColumnId}...`)

      try {
        // Call the API to update the Jira issue status
        const response = await fetch("/api/jira/update-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            issueKey: movedTask.key,
            statusCategory: destColumnId,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success(`Task moved successfully in Jira`, {
            id: toastId,
          })
        } else {
          // If the API call fails, show error but don't revert the UI
          // This is to prevent confusion when the UI and Jira get out of sync
          toast.error(`Note: Failed to update in Jira: ${data.error}`, {
            id: toastId,
          })

          // Don't refresh the board, just keep the UI state as is
          // This is because Kanban projects might have different workflows
          // and the UI state might be more accurate than what we get from Jira
        }
      } catch (error) {
        console.error("Error updating Jira status:", error)
        toast.error(`Error updating Jira: ${error instanceof Error ? error.message : "Unknown error"}`, {
          id: toastId,
        })

        // Don't refresh the board, just keep the UI state as is
      }
    }

    setActiveId(null)
    setActiveTask(null)
  }

  const handleAddTask = (columnId: string) => {
    setCurrentColumnId(columnId)
    setNewTaskContent("")
    setNewTaskDialogOpen(true)
  }

  const handleCreateTask = () => {
    if (newTaskContent.trim() && currentColumnId) {
      // In a real implementation, you would create a new Jira issue here
      toast.success("New task created")
      toast.info("Note: This is a visual change only. In a real implementation, this would create a new Jira issue.")

      setNewTaskDialogOpen(false)
      setNewTaskContent("")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Jira issues...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive mb-4">Error loading Jira issues: {error}</p>
        <Button onClick={() => fetchIssues()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {columns.map((column) => (
            <KanbanColumn key={column.id} id={column.id} title={column.title} tasks={column.tasks} onAddTask={() => handleAddTask(column.id)} />
          ))}
        </div>

        <DragOverlay>{activeId && activeTask ? <KanbanItem id={activeId} task={activeTask} /> : null}</DragOverlay>
      </DndContext>

      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter task description"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
