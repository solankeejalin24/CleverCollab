"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useChatbot } from "@/components/ChatbotContext"
import { useSkills } from "@/components/SkillsContext"
import { LoginModal } from "@/components/LoginModal"
import { SignupModal } from "@/components/SignupModal"

export default function Home() {
  const { openChatbot } = useChatbot()
  const { openSkillsModal } = useSkills()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 text-center">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="outline" onClick={() => setIsLoginModalOpen(true)}>
          Login
        </Button>
        <Button onClick={() => setIsSignupModalOpen(true)}>Sign Up</Button>
      </div>

      <div className="mb-12">
        <Logo size="large" />
      </div>

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

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}

