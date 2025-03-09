"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanItem } from "./KanbanItem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]" scrollHideDelay={100}>
          <div 
            ref={setNodeRef} 
            className="space-y-2 min-h-[200px] p-3"
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
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
    </Card>
  )
}
