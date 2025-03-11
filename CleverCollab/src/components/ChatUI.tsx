"use client"

import { FormEvent, useRef, useEffect } from "react"
import { Send, Trash2, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useChat } from "ai/react"
import { useChatbot } from "./ChatbotContext"
import { useUser } from "@clerk/nextjs"
import { useJira } from "@/hooks/useJira"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Custom components for markdown rendering
const MarkdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold my-3" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold my-2" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-md font-bold my-2" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-base font-semibold my-1" {...props} />,
  p: ({ node, ...props }: any) => <p className="my-2" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 my-2" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 my-2" {...props} />,
  li: ({ node, ...props }: any) => <li className="my-1" {...props} />,
  a: ({ node, ...props }: any) => <a className="text-blue-500 hover:underline" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-bold" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
  code: ({ node, inline, ...props }: any) => 
    inline ? <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props} /> 
    : <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto" {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic" {...props} />,
  table: ({ node, ...props }: any) => <table className="border-collapse border border-gray-300 dark:border-gray-600 my-2 w-full" {...props} />,
  th: ({ node, ...props }: any) => <th className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800" {...props} />,
  td: ({ node, ...props }: any) => <td className="border border-gray-300 dark:border-gray-600 p-2" {...props} />,
};

export function ChatUI({ className }: { className?: string }) {
  const { isOpen } = useChatbot();
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const userName = user?.firstName || user?.lastName || user?.username;
  const { currentUserIssues, issues, fetchIssues } = useJira();
  
  // Fetch issues when the component mounts
  useEffect(() => {
    if (user) {
      fetchIssues();
    }
  }, [user, fetchIssues]);
  
  // Create a system message with user context
  const systemMessage = `You are a Project Management AI Assistant that helps with task assignments, prioritization, workload management, and identifying project bottlenecks.

When answering questions:
1. Provide clear, actionable recommendations
2. Explain your reasoning process
3. Be specific about task assignments, priorities, and potential issues
4. Consider both skills and current workload when making recommendations

Current user: ${userName || 'Unknown'} (${userEmail || 'No email'})
Current user's assigned tasks: ${currentUserIssues.length > 0 
  ? currentUserIssues.map(issue => `${issue.key}: ${issue.summary} (${issue.status})`).join(', ') 
  : 'None'}
Total project tasks: ${issues.length}

You can answer questions such as:
- "Who should I assign task XYZ to?"
- "Who is most experienced with my task XYZ so I can reach out to them for help?"
- "Who is likely to miss their deadline?"
- "How should I prioritize my tasks to finish everything on time?"
- "Predict potential project bottlenecks."

Current date: ${new Date().toLocaleDateString()}`;
  
  // Use the Vercel AI SDK's useChat hook directly with simplified options
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        content: "Hello! I'm your Project Management AI Assistant. I can help with task assignments, prioritization, workload management, and identifying project bottlenecks. How can I assist you today?",
        role: "assistant",
      },
    ],
    body: {
      model: "gpt-4o",
      temperature: 0.7,
      userEmail: userEmail
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
    streamProtocol: 'text'
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (inputRef.current && isOpen) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        content: "Hello! I'm your Project Management AI Assistant. I can help with task assignments, prioritization, workload management, and identifying project bottlenecks. How can I assist you today?",
        role: "assistant",
      },
    ])
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      console.log("Submitting message:", input);
      handleSubmit(e)
    }
  }

  // Add debugging logs for messages
  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

  // Add debugging logs for loading state
  useEffect(() => {
    console.log("Loading state:", isLoading);
  }, [isLoading]);

  // Display error message if there's an error
  useEffect(() => {
    if (error) {
      console.error("Chat error detected:", error);
    }
  }, [error]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="font-semibold">Project Management Assistant</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clearChat} 
          aria-label="Clear chat"
          className="hover:bg-destructive/10 hover:text-destructive"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1" scrollHideDelay={100} type="always">
        <div className="flex flex-col gap-4 p-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex rounded-lg px-4 py-2",
                message.role === "user" 
                  ? "ml-auto bg-primary text-primary-foreground max-w-[80%]" 
                  : "bg-muted text-foreground max-w-[90%]",
              )}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 bg-muted text-foreground rounded-lg px-4 py-2 max-w-[80%]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={onSubmit} className="border-t p-4 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask about task assignments, priorities, workload..."
            value={input}
            onChange={handleInputChange}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
