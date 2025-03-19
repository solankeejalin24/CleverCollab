"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useChatbot } from "@/components/ChatbotContext"
import { useSkills } from "@/components/SkillsContext"
import { LoginModal } from "@/components/LoginModal"
import { SignupModal } from "@/components/SignupModal"
import { useJira } from "@/hooks/useJira"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, CheckCircle2, CircleDashed, Loader2, ClockIcon, LinkIcon, InfoIcon } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Function to prioritize tasks based on skills, deadlines, and estimated hours
const prioritizeTasks = (tasks: any[]) => {
  if (!tasks || tasks.length === 0) return [];
  
  return [...tasks].sort((a, b) => {
    // First priority: Status category - done tasks should be at the bottom
    if (a.statusCategory === "done" && b.statusCategory !== "done") return 1;
    if (a.statusCategory !== "done" && b.statusCategory === "done") return -1;
    
    // For tasks with the same completion status, prioritize by:
    
    // 1. Due date - tasks with closer due dates get higher priority
    if (a.dueDate && b.dueDate) {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
    } else if (a.dueDate) {
      return -1; // Task with due date comes first
    } else if (b.dueDate) {
      return 1;
    }
    
    // 2. Status category - in-progress tasks get priority over todo tasks
    if (a.statusCategory !== b.statusCategory) {
      if (a.statusCategory === "in-progress") return -1;
      if (b.statusCategory === "in-progress") return 1;
    }
    
    // 3. Estimated hours - shorter tasks get priority (quick wins)
    if (a.estimatedHours && b.estimatedHours) {
      return a.estimatedHours - b.estimatedHours;
    } else if (a.estimatedHours) {
      return -1; // Task with estimate comes first
    } else if (b.estimatedHours) {
      return 1;
    }
    
    // 4. Issue type - bugs get priority over tasks, tasks over stories
    if (a.issueType !== b.issueType) {
      if (a.issueType.toLowerCase().includes("bug")) return -1;
      if (b.issueType.toLowerCase().includes("bug")) return 1;
      if (a.issueType.toLowerCase().includes("task")) return -1;
      if (b.issueType.toLowerCase().includes("task")) return 1;
    }
    
    return 0;
  });
};

export default function Home() {
  const { openChatbot } = useChatbot()
  const { openSkillsModal } = useSkills()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const { user } = useUser()
  const { issues, loading, error, fetchIssues, getMyIssues } = useJira()
  const [myIssues, setMyIssues] = useState<any[]>([])

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetchIssues()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const userEmail = user.emailAddresses?.[0]?.emailAddress || undefined
      const userName = user.firstName || user.lastName || user.username || undefined

      console.log("Current user:", {
        email: userEmail,
        name: userName,
        fullUser: user,
      })

      // Get user's issues and prioritize them
      const userIssues = getMyIssues(userEmail, userName);
      const prioritizedIssues = prioritizeTasks(userIssues);
      setMyIssues(prioritizedIssues);
    }
  }, [issues, user])

  // Get badge color based on issue type
  const getBadgeVariant = (issueType: string) => {
    const type = issueType.toLowerCase()
    if (type.includes("bug")) return "destructive"
    if (type.includes("story")) return "default"
    if (type.includes("task")) return "secondary"
    return "outline"
  }

  // Get status icon
  const getStatusIcon = (statusCategory: string) => {
    switch (statusCategory) {
      case "todo":
        return <CircleDashed className="h-4 w-4 text-muted-foreground" />
      case "in-progress":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <CircleDashed className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        <SignedOut>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </SignedOut>

        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-0">
            <Logo size="large" />
          </div>

          <SignedIn>
            <h2 className="text-2xl font-medium mb-4">Welcome, {user?.firstName || user?.username || "User"}!</h2>

            <div className="w-full max-w-4xl mb-8">
              <Card className="bg-card border shadow-sm overflow-hidden">
                <CardHeader className="bg-background sticky top-0 z-10 pb-2">
                  <CardTitle className="text-xl">My Tasks ✨</CardTitle>
                  <CardDescription className="mb-0">Your assigned tasks, intelligently prioritized</CardDescription>
                </CardHeader>
                {loading ? (
                  <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span>Loading your tasks...</span>
                  </CardContent>
                ) : error ? (
                  <CardContent className="text-center py-6">
                    <p className="text-destructive mb-2">Error loading tasks: {error}</p>
                    <Button onClick={() => fetchIssues()} variant="outline" size="sm">
                      Retry
                    </Button>
                  </CardContent>
                ) : myIssues.length === 0 ? (
                  <CardContent className="text-center py-6 text-muted-foreground">
                    <p>You don&apos;t have any assigned tasks.</p>
                  </CardContent>
                ) : (
                  <ScrollArea className="h-[300px]" scrollHideDelay={100}>
                    <CardContent className="p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <TooltipProvider>
                          {myIssues.map((issue) => (
                            <Tooltip key={issue.id}>
                              <TooltipTrigger asChild>
                                <Card
                                  className="border-primary/20 dark:border-primary/10 hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-200 overflow-hidden"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex justify-between items-start mb-1">
                                      <Badge variant={getBadgeVariant(issue.issueType)} className="text-xs">
                                        {issue.issueType}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{issue.key}</span>
                                    </div>

                                    <div className="flex justify-between items-start mb-1">
                                      <h3 className="font-medium">{issue.summary}</h3>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <div className="flex items-center gap-1">
                                        {getStatusIcon(issue.statusCategory)}
                                        <span>{issue.status}</span>
                                      </div>

                                      {issue.dueDate && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <CalendarIcon className="h-3 w-3" />
                                          <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>
                                        </div>
                                      )}

                                      {issue.estimatedHours && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <ClockIcon className="h-3 w-3" />
                                          <span>{issue.estimatedHours}h</span>
                                        </div>
                                      )}
                                    </div>

                                    {issue.parent && issue.parent !== "No Parent" && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <LinkIcon className="h-3 w-3" />
                                        <span className="truncate">{issue.parent}</span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </TooltipTrigger>
                              {issue.description && (
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">{issue.description}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </ScrollArea>
                )}
              </Card>
            </div>
          </SignedIn>

          <SignedOut>
            <h2 className="text-2xl font-medium mb-3">Welcome to Clever Collab</h2>
          </SignedOut>

          <p className="text-xl text-muted-foreground mb-6 max-w-md text-center">
            Autonomous AI agent for intelligent project management, data retrieval, and real-time collaboration
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button 
              asChild 
              size="lg" 
              className="px-8 bg-[#212245] hover:bg-[#212245]/80 text-white transition-colors"
            >
              <Link href="/kanban">Go to Kanban Board</Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="px-8 bg-[#64c6c4] hover:bg-[#64c6c4]/80 text-white transition-colors"
            >
              <Link href="/help" onClick={openChatbot}>Open AI Chatbot</Link>
            </Button>
          </div>

          <Button
            onClick={openSkillsModal}
            size="lg"
            className="px-8 bg-[#a4cb6a] hover:bg-[#a4cb6a]/80 text-white hover:text-white transition-colors"
          >
            Manage Skills
          </Button>

          <SignedOut>
            <div className="mt-8 p-4 border rounded-lg bg-card/50 backdrop-blur-sm max-w-md w-full shadow-sm">
              <h3 className="text-xl font-medium mb-2">Get Started</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to your account to access all features and save your progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="px-8 w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 w-full border-primary text-primary hover:bg-primary/10"
                >
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            </div>
          </SignedOut>
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}
