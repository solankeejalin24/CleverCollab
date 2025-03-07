// src/app/layout.tsx
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { Header } from "@/components/Header"
import { ThemeProvider } from "@/components/ThemeProvider"
import { ChatbotProvider } from "@/components/ChatbotContext"
import { SkillsProvider } from "@/components/SkillsContext"
import { ChatbotDrawer } from "@/components/ChatbotDrawer"
import { SkillsModal } from "@/components/SkillsModal"
import { Toaster } from "@/components/ui/sonner"
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Clever Collab",
  description: "A collaboration and AI-powered tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider defaultTheme="light">
            <ChatbotProvider>
              <SkillsProvider>
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <ChatbotDrawer />
                  <SkillsModal />
                  <Toaster />
                </div>
              </SkillsProvider>
            </ChatbotProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}