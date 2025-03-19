"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { MessageSquareText, Menu, Info } from 'lucide-react'
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Logo } from "@/components/Logo"
import { useChatbot } from "./ChatbotContext"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Header() {
  const pathname = usePathname()
  const { openChatbot } = useChatbot()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-black sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-1">
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
              Chatbot
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                  aria-label="About CleverCollab"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center" className="max-w-xs">
                <div className="text-sm">
                  <h3 className="font-semibold mb-1">CleverCollab Features:</h3>
                  <ul className="pl-2 space-y-1.5">
                    <li><span className="font-medium">Home:</span> Prioritized tasks with intelligent sorting by due date, status, and estimated hours.</li>
                    <li><span className="font-medium">Kanban Board:</span> Real-time Jira integration with AI-powered task creation and refinement.</li>
                    <li><span className="font-medium">Chatbot:</span> AI assistant for task assignment, workload distribution, skill matching, and project queries.</li>
                    <li><span className="font-medium">Skills Management:</span> Track and assign team members based on abilities and expertise.</li>
                    <li><span className="font-medium">Email Features:</span> Send chat transcripts to your email for future reference.</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={openChatbot} 
            aria-label="Open Chatbot"
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            <MessageSquareText className="h-5 w-5" />
          </Button>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <div className="hidden sm:flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </SignedOut>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    href="/"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === "/" ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/kanban"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === "/kanban" ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Kanban Board
                  </Link>
                  <Link
                    href="/help"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === "/help" ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help
                  </Link>
                  <SignedOut>
                    <div className="flex flex-col gap-2 mt-4">
                      <Button 
                        asChild
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        asChild
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  </SignedOut>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
