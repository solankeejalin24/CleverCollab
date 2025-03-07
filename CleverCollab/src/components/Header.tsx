// "use client"

// import { usePathname } from "next/navigation"
// import Link from "next/link"
// import { MessageSquareText } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { ThemeToggle } from "@/components/ThemeToggle"
// import { Logo } from "@/components/Logo"
// import { useChatbot } from "./ChatbotContext"

// export function Header() {
//   const pathname = usePathname()
//   const { openChatbot } = useChatbot()

//   return (
//     <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//       <div className="container flex h-16 items-center justify-between">
//         <div className="flex items-center gap-6">
//           <Logo />
//           <nav className="hidden md:flex gap-6">
//             <Link
//               href="/"
//               className={`text-sm font-medium transition-colors hover:text-primary ${
//                 pathname === "/" ? "text-primary" : "text-muted-foreground"
//               }`}
//             >
//               Home
//             </Link>
//             <Link
//               href="/kanban"
//               className={`text-sm font-medium transition-colors hover:text-primary ${
//                 pathname === "/kanban" ? "text-primary" : "text-muted-foreground"
//               }`}
//             >
//               Kanban Board
//             </Link>
//             <Link
//               href="/help"
//               className={`text-sm font-medium transition-colors hover:text-primary ${
//                 pathname === "/help" ? "text-primary" : "text-muted-foreground"
//               }`}
//             >
//               Help
//             </Link>
//           </nav>
//         </div>
//         {/* <div className="flex items-center gap-2">
//           <ThemeToggle />
//           <Button variant="outline" size="icon" onClick={openChatbot} aria-label="Open Chatbot">
//             <MessageSquareText className="h-5 w-5" />
//           </Button>
//         </div> */}
//       </div>
//     </header>
//   )
// }

// src/components/Header.tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Logo className="mr-4" />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <SignedIn>
              <Link href="/" className="mr-6">
                Dashboard
              </Link>
            </SignedIn>
          </nav>
          <div className="flex items-center space-x-2">
            <SignedOut>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}