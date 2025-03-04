"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

type ChatbotContextType = {
  isOpen: boolean
  messages: Message[]
  openChatbot: () => void
  closeChatbot: () => void
  sendMessage: (content: string) => void
  clearMessages: () => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your Clever Collab assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])

  const openChatbot = () => setIsOpen(true)
  const closeChatbot = () => setIsOpen(false)

  const sendMessage = (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I received your message: "${content}". This is a simulated response from the AI assistant.`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const clearMessages = () => {
    setMessages([
      {
        id: "1",
        content: "Hello! I'm your Clever Collab assistant. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        messages,
        openChatbot,
        closeChatbot,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return context
}

