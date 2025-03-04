"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import type { Task } from "./KanbanBoard"

interface KanbanItemProps {
  id: string
  task: Task
}

export function KanbanItem({ id, task }: KanbanItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing border-primary/20 dark:border-primary/10 hover:border-primary/50 dark:hover:border-primary/30 bg-card"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <p>{task.content}</p>
      </CardContent>
    </Card>
  )
}

