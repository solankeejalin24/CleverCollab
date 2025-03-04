import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/Header"
import { ThemeProvider } from "@/components/ThemeProvider"
import { ChatbotProvider } from "@/components/ChatbotContext"
import { SkillsProvider } from "@/components/SkillsContext"
import { ChatbotDrawer } from "@/components/ChatbotDrawer"
import { SkillsModal } from "@/components/SkillsModal"
import { Toaster } from "@/components/ui/sonner"

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system">
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
  )
}

