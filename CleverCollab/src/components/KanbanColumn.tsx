"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanItem } from "./KanbanItem"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task } from "./KanbanBoard"

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  onAddTask: () => void
}

export function KanbanColumn({ id, title, tasks, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `column-${id}`,
  })

  // Determine column color based on id
  const getColumnColor = () => {
    switch (id) {
      case "todo":
        return "border-primary/20 dark:border-primary/10 bg-primary/5 dark:bg-primary/5"
      case "in-progress":
        return "border-accent/20 dark:border-accent/10 bg-accent/5 dark:bg-accent/5"
      case "done":
        return "border-secondary/20 dark:border-secondary/10 bg-secondary/5 dark:bg-secondary/5"
      default:
        return ""
    }
  }

  return (
    <Card className={`h-full flex flex-col ${getColumnColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAddTask}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Add task</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div ref={setNodeRef} className="space-y-2 min-h-[200px] p-1">
          <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <KanbanItem key={task.id} id={task.id} task={task} />
            ))}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  )
}

