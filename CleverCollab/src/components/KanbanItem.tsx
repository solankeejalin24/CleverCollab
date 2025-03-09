"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, User2Icon, ClockIcon, LinkIcon } from "lucide-react"
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

  // Get badge color based on issue type
  const getBadgeVariant = () => {
    const type = task.issueType?.toLowerCase() || '';
    if (type.includes('bug')) return "destructive";
    if (type.includes('story')) return "default";
    if (type.includes('task')) return "secondary";
    return "outline";
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing border-primary/20 dark:border-primary/10 hover:border-primary/50 dark:hover:border-primary/30 bg-card"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        {task.key && (
          <div className="flex justify-between items-start">
            <Badge variant={getBadgeVariant()} className="text-xs">
              {task.issueType}
            </Badge>
            <span className="text-xs text-muted-foreground">{task.key}</span>
          </div>
        )}
        
        <p className="font-medium">{task.content}</p>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User2Icon className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}
          
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>
        
        {task.parent && task.parent !== 'No Parent' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <LinkIcon className="h-3 w-3" />
            <span className="truncate">{task.parent}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

