"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useChatbot } from "./ChatbotContext"
import { ChatUI } from "./ChatUI"

export function ChatbotDrawer() {
  const { isOpen, closeChatbot } = useChatbot()

  return (
    <Sheet open={isOpen} onOpenChange={closeChatbot}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <ChatUI className="h-full" />
      </SheetContent>
    </Sheet>
  )
}

