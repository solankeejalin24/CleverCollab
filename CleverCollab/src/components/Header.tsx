"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { MessageSquareText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Logo } from "@/components/Logo"
import { useChatbot } from "./ChatbotContext"

export function Header() {
  const pathname = usePathname()
  const { openChatbot } = useChatbot()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/kanban"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/kanban" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Kanban Board
            </Link>
            <Link
              href="/help"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/help" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Help
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={openChatbot} aria-label="Open Chatbot">
            <MessageSquareText className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

