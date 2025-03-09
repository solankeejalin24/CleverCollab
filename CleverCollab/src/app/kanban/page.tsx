"use client"

import { memo } from "react"
import { KanbanBoard } from "@/components/KanbanBoard"

// Use memo to prevent unnecessary re-renders
const MemoizedKanbanBoard = memo(KanbanBoard)

export default function KanbanPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-0 h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold mb-6">Kanban Board</h1>
      <div className="h-[calc(100vh-9rem)]">
        <MemoizedKanbanBoard />
      </div>
    </div>
  )
}
