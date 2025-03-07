"use client"

import { useState } from "react"
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

export type Task = {
  id: string
  content: string
}

export type Column = {
  id: string
  title: string
  tasks: Task[]
}

export function KanbanBoard() {
  // const { toast } = useToast()
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "todo",
      title: "To Do",
      tasks: [
        { id: "task-1", content: "Research competitors" },
        { id: "task-2", content: "Create project plan" },
        { id: "task-3", content: "Design wireframes" },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        { id: "task-4", content: "Develop landing page" },
        { id: "task-5", content: "Set up analytics" },
      ],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        { id: "task-6", content: "Initial team meeting" },
        { id: "task-7", content: "Define project scope" },
      ],
    },
  ])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false)
  const [newTaskContent, setNewTaskContent] = useState("")
  const [currentColumnId, setCurrentColumnId] = useState<string | null>(null)

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

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveTask(null)
      return
    }

    // Find source and destination columns
    let sourceColumnId: string | null = null
    let destColumnId: string | null = null

    for (const column of columns) {
      if (column.tasks.some((task) => task.id === active.id)) {
        sourceColumnId = column.id
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

    if (sourceColumnId && destColumnId) {
      setColumns((prevColumns) => {
        return prevColumns.map((column) => {
          // Remove from source column
          if (column.id === sourceColumnId) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== active.id),
            }
          }

          // Add to destination column
          if (column.id === destColumnId) {
            const updatedTasks = [...column.tasks]
            const activeTask = prevColumns
              .find((col) => col.id === sourceColumnId)
              ?.tasks.find((task) => task.id === active.id)

            if (activeTask) {
              if (over.id.startsWith("column-")) {
                // Add to the end of the column
                updatedTasks.push(activeTask)
              } else {
                // Add before the task that was hovered over
                const overTaskIndex = updatedTasks.findIndex((task) => task.id === over.id)
                if (overTaskIndex !== -1) {
                  updatedTasks.splice(overTaskIndex, 0, activeTask)
                } else {
                  updatedTasks.push(activeTask)
                }
              }

              return {
                ...column,
                tasks: updatedTasks,
              }
            }
          }

          return column
        })
      })

      toast.success("Task moved successfully")
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
      const newTask: Task = {
        id: `task-${Date.now()}`,
        content: newTaskContent,
      }

      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === currentColumnId ? { ...column, tasks: [...column.tasks, newTask] } : column,
        ),
      )

      setNewTaskDialogOpen(false)
      setNewTaskContent("")

      toast.success("New task created")
    }
  }

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={column.tasks}
              onAddTask={() => handleAddTask(column.id)}
            />
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
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

