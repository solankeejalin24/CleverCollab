// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Logo } from "@/components/Logo"
// import { useChatbot } from "@/components/ChatbotContext"
// import { useSkills } from "@/components/SkillsContext"
// import { LoginModal } from "@/components/LoginModal"
// import { SignupModal } from "@/components/SignupModal"

// export default function Home() {
//   const { openChatbot } = useChatbot()
//   const { openSkillsModal } = useSkills()
//   const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
//   const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

//   return (
//     <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 text-center">

//       <div className="mb-12">
//         <Logo size="large" />
//       </div>

//       <p className="text-xl text-muted-foreground mb-12 max-w-md">
//         A powerful collaboration tool with AI assistance to boost your productivity
//       </p>

//       <div className="flex flex-col sm:flex-row gap-4 mb-8">
//         <Button asChild size="lg" className="px-8">
//           <Link href="/kanban">Go to Kanban Board</Link>
//         </Button>

//         <Button asChild size="lg" variant="outline" className="px-8">
//           <Link href="/help">Open AI Chatbot</Link>
//         </Button>
//       </div>

//       <Button onClick={openSkillsModal} variant="secondary" size="lg" className="px-8">
//         Manage Skills
//       </Button>

//       <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

//       <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
//     </div>
//   )
// }

// src/app/page.tsx
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { JiraProjects } from "@/components/JiraProjects";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <SignedIn>
        <h1 className="text-3xl font-bold mb-8">Your Jira Projects</h1>
        <JiraProjects />
      </SignedIn>
      
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Clever Collab</h1>
          <p className="text-xl mb-8 max-w-2xl">
            An AI-powered project management utility that integrates with Atlassian&apos;s tools
            to help you manage your tasks and projects more efficiently.
          </p>
          <div className="space-x-4">
            <Button className="px-6 py-2" asChild>
              <a href="/sign-in">Sign In</a>
            </Button>
            <Button className="px-6 py-2" variant="outline" asChild>
              <a href="/sign-up">Sign Up</a>
            </Button>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}