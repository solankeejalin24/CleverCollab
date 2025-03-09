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
import { CalendarIcon, CheckCircle2, CircleDashed, Loader2, ClockIcon, LinkIcon } from "lucide-react"

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
      const userEmail = user.emailAddresses?.[0]?.emailAddress || undefined;
      const userName = user.firstName || user.lastName || user.username || undefined;
      
      console.log('Current user:', { 
        email: userEmail, 
        name: userName,
        fullUser: user
      });
      
      setMyIssues(getMyIssues(userEmail, userName));
    }
  }, [issues, user])

  // Get badge color based on issue type
  const getBadgeVariant = (issueType: string) => {
    const type = issueType.toLowerCase();
    if (type.includes('bug')) return "destructive";
    if (type.includes('story')) return "default";
    if (type.includes('task')) return "secondary";
    return "outline";
  };

  // Get status icon
  const getStatusIcon = (statusCategory: string) => {
    switch (statusCategory) {
      case 'todo':
        return <CircleDashed className="h-4 w-4 text-muted-foreground" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <CircleDashed className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 text-center">
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

      <div className="mb-8">
        <Logo size="large" />
      </div>

      <SignedIn>
        <h2 className="text-2xl font-medium mb-4">Welcome, {user?.firstName || user?.username || "User"}!</h2>
        
        <div className="w-full max-w-4xl mb-8">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>
                Your assigned Jira issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>Loading your tasks...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-2">Error loading tasks: {error}</p>
                  <Button onClick={() => fetchIssues()} variant="outline" size="sm">Retry</Button>
                </div>
              ) : myIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You don&apos;t have any assigned tasks.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {myIssues.map((issue) => (
                    <Card key={issue.id} className="border-primary/20 dark:border-primary/10 hover:border-primary/50 dark:hover:border-primary/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={getBadgeVariant(issue.issueType)} className="text-xs">
                            {issue.issueType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{issue.key}</span>
                        </div>
                        
                        <h3 className="font-medium mb-2">{issue.summary}</h3>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
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
                        
                        {issue.parent && issue.parent !== 'No Parent' && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <LinkIcon className="h-3 w-3" />
                            <span className="truncate">{issue.parent}</span>
                          </div>
                        )}
                        
                        {issue.description && (
                          <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                            {issue.description}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SignedIn>

      <SignedOut>
        <h2 className="text-2xl font-medium mb-4">Welcome to Clever Collab</h2>
      </SignedOut>

      <p className="text-xl text-muted-foreground mb-12 max-w-md">
        A powerful collaboration tool with AI assistance to boost your productivity
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button asChild size="lg" className="px-8">
          <Link href="/kanban">Go to Kanban Board</Link>
        </Button>

        <Button asChild size="lg" variant="outline" className="px-8">
          <Link href="/help">Open AI Chatbot</Link>
        </Button>
      </div>

      <Button onClick={openSkillsModal} variant="secondary" size="lg" className="px-8">
        Manage Skills
      </Button>

      <SignedOut>
        <div className="mt-12 p-6 border rounded-lg bg-card/50 backdrop-blur-sm max-w-md">
          <h3 className="text-xl font-medium mb-4">Get Started</h3>
          <p className="text-muted-foreground mb-6">
            Sign in to your account to access all features and save your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="px-8 w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 w-full">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </SignedOut>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}

