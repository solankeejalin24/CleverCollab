"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanItem } from "./KanbanItem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Task } from "./KanbanBoard"
import { Plus } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import { NewTaskModal } from "./NewTaskModal"

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  onTaskCreated?: (task: Task) => void
}

export default function KanbanColumn({ id, title, tasks, onTaskCreated }: KanbanColumnProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const { setNodeRef } = useDroppable({
    id: `column-${id}`,
  })

  // Determine column color based on id
  const getColumnColor = () => {
    switch (id) {
      case "todo":
        return "bg-primary/5 border-primary/20 dark:border-primary/10"
      case "in-progress":
        return "bg-accent/5 border-accent/20 dark:border-accent/10"
      case "done":
        return "bg-secondary/5 border-secondary/20 dark:border-secondary/10"
      default:
        return ""
    }
  }

  return (
    <Card className={`h-full flex flex-col overflow-hidden ${getColumnColor()}`}>
      <CardHeader className={`pb-2 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]" scrollHideDelay={100}>
          <div 
            ref={setNodeRef} 
            className="space-y-2 min-h-[200px]"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", margin:"0 auto", width: "100%", }}
          >
            <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <div key={task.id} style={{ width: "90%" }}>
                  <KanbanItem id={task.id} task={task} />
                </div>
              ))}
            </SortableContext>
          </div>
        </ScrollArea>
      </CardContent>
      <NewTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        initialColumnId={id}
        onTaskCreated={(taskKey) => {
          console.log(`Task ${taskKey} created in column ${id}`);
          if (onTaskCreated) {
            // Create a task object with all required properties from the Task type
            onTaskCreated({
              id: taskKey,
              content: taskKey,
              key: taskKey,
              status: id
            });
          }
        }}
      />
    </Card>
  )
}
