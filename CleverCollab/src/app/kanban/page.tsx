import { KanbanBoard } from "@/components/KanbanBoard"

export default function KanbanPage() {
  return (
    <div className="container py-6 h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold mb-6">Kanban Board</h1>
      <KanbanBoard />
    </div>
  )
}

