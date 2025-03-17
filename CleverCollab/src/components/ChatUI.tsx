"use client"

import { FormEvent, useRef, useEffect, useCallback } from "react"
import { Send, Trash2, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useChat } from "ai/react"
import { useChatbot } from "./ChatbotContext"
import { useUser } from "@clerk/nextjs"
import { useJira } from "@/hooks/useJira"
import { FormattedJiraIssue } from "@/lib/jira"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from "sonner"

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

// Component for task assignment button
function TaskAssignmentButton({ taskKey, assignee, onAssign }: { 
  taskKey: string; 
  assignee: string; 
  onAssign: (taskKey: string, assignee: string) => void;
}) {
  return (
    <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Assign Task</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">Task Key:</div>
          <div className="text-xs font-medium">{taskKey}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Assignee:</div>
          <div className="text-xs font-medium">{assignee}</div>
        </div>
        <button 
          onClick={() => onAssign(taskKey, assignee)}
          className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 py-1 px-3 rounded-md text-sm font-medium"
        >
          Confirm Assignment
        </button>
      </div>
    </div>
  );
}

export function ChatUI({ className }: { className?: string }) {
  const { isOpen } = useChatbot();
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const userName = user?.firstName || user?.lastName || user?.username;
  const { currentUserIssues, issues, fetchIssues } = useJira();
  
  // Function to directly assign a task
  const assignTask = useCallback(async (taskKey: string, assignee: string) => {
    if (!taskKey || !assignee) {
      console.error('[ChatUI] Missing taskKey or assignee for assignment');
      toast.error('Cannot assign task: Missing task key or assignee');
      return;
    }
    
    console.log(`[ChatUI] Directly assigning task ${taskKey} to ${assignee}`);
    
    try {
      // Validate task key format
      if (!/^[A-Za-z0-9]+-[0-9]+$/.test(taskKey)) {
        console.error(`[ChatUI] Invalid task key format: ${taskKey}`);
        toast.error(`Invalid task key format: ${taskKey}`);
        return { success: false, error: 'Invalid task key format' };
      }
      
      // Check if the task exists in our local issues list
      const taskExists = issues.some(issue => issue.key.toLowerCase() === taskKey.toLowerCase());
      if (!taskExists) {
        console.warn(`[ChatUI] Task ${taskKey} not found in local issues list. Proceeding anyway.`);
      }
      
      // Find the exact team member by name in our issues list
      let assigneeId = assignee;
      
      // Check if assignee is a name (not an email or ID)
      const isEmail = assignee.includes('@');
      const isAccountId = assignee.includes(':') || /^[0-9a-f]{24}$/i.test(assignee);
      
      if (isAccountId) {
        console.log(`[ChatUI] Assignee "${assignee}" appears to be an account ID, using as is`);
        // Use the ID directly
      } else if (isEmail) {
        console.log(`[ChatUI] Assignee "${assignee}" appears to be an email, using as is`);
        // Use the email directly
      } else {
        console.log(`[ChatUI] Assignee "${assignee}" appears to be a name, looking for matching team member`);
        
        // Try to find a matching team member in our issues list
        const matchingIssue = issues.find(issue => 
          issue.assignee && issue.assignee.toLowerCase() === assignee.toLowerCase()
        );
        
        if (matchingIssue && matchingIssue.assigneeAccountId) {
          console.log(`[ChatUI] Found exact matching team member with account ID: ${matchingIssue.assigneeAccountId}`);
          assigneeId = matchingIssue.assigneeAccountId;
        } else {
          // Try partial match
          const partialMatchIssue = issues.find(issue => 
            issue.assignee && issue.assignee.toLowerCase().includes(assignee.toLowerCase())
          );
          
          if (partialMatchIssue && partialMatchIssue.assigneeAccountId) {
            console.log(`[ChatUI] Found partial matching team member with account ID: ${partialMatchIssue.assigneeAccountId}`);
            assigneeId = partialMatchIssue.assigneeAccountId;
          } else if (partialMatchIssue && partialMatchIssue.assigneeEmail) {
            console.log(`[ChatUI] Found partial matching team member with email: ${partialMatchIssue.assigneeEmail}`);
            assigneeId = partialMatchIssue.assigneeEmail;
          } else {
            console.log(`[ChatUI] No matching team member found in issues list, proceeding with name`);
            // The API will handle name lookup using team_members.json
          }
        }
      }
      
      console.log(`[ChatUI] Final assignee value for API call: ${assigneeId}`);
      
      // Make a direct API call to assign the task
      const response = await fetch('/api/jira/assign-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskKey, assignee: assigneeId }),
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to assign task (${response.status})`;
        
        try {
          // Try to parse the error response as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text if it's not too long
          if (errorText && errorText.length < 100) {
            errorMessage = errorText;
          }
        }
        
        console.error(`[ChatUI] Assignment API error (${response.status}):`, errorText);
        
        // Provide more helpful error messages based on status code
        if (response.status === 404) {
          toast.error(`Task ${taskKey} not found or user ${assignee} not found in Jira`);
        } else if (response.status === 401 || response.status === 403) {
          toast.error('Not authorized to assign this task');
        } else {
          toast.error(errorMessage);
        }
        
        return { success: false, error: errorMessage };
      }
      
      const data = await response.json();
      console.log('[ChatUI] Assignment API response:', data);
      
      // Check for toast notification in headers
      const showToast = response.headers.get('X-Show-Toast');
      if (showToast) {
        try {
          const toastData = JSON.parse(showToast);
          const toastType = (toastData.type || 'info') as 'success' | 'error' | 'info' | 'warning';
          
          console.log("[ChatUI] Displaying toast:", { type: toastType, message: toastData.message });
          
          // Use the appropriate toast function based on type
          switch (toastType) {
            case 'success':
              toast.success(toastData.message || 'Task assignment processed');
              break;
            case 'error':
              toast.error(toastData.message || 'Task assignment failed');
              break;
            case 'warning':
              toast.warning(toastData.message || 'Task assignment warning');
              break;
            default:
              toast.info(toastData.message || 'Task assignment processed');
          }
        } catch (error) {
          console.error('[ChatUI] Error parsing toast data:', error);
          
          if (data.success) {
            toast.success(`Successfully assigned task ${taskKey} to ${assignee}`);
          } else {
            toast.error(`Failed to assign task: ${data.error || 'Unknown error'}`);
          }
        }
      } else {
        // Fallback toast based on response data
        if (data.success) {
          toast.success(`Successfully assigned task ${taskKey} to ${assignee}`);
        } else {
          toast.error(`Failed to assign task: ${data.error || 'Unknown error'}`);
        }
      }
      
      return data;
    } catch (error: any) {
      console.error('[ChatUI] Error assigning task:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to assign task: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [issues]);
  
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
5. Always provide comprehensive information about tasks, including their type, status, and details

Current user: ${userName || 'Unknown'} (${userEmail || 'No email'})

Current user's assigned tasks: ${currentUserIssues.length > 0 
  ? currentUserIssues.map(issue => 
      `- ${issue.key}: ${issue.summary} (Type: ${issue.issueType}, Status: ${issue.status}${issue.dueDate ? `, Due: ${issue.dueDate}` : ''})${issue.estimatedHours ? `, Est. Hours: ${issue.estimatedHours}` : ''}`
    ).join('\n') 
  : 'None'}

All project tasks: ${issues.length > 0 
  ? '\n' + issues.map(issue => 
      `- ${issue.key}: ${issue.summary} (Type: ${issue.issueType}, Status: ${issue.status}, Assignee: ${issue.assignee}${issue.dueDate ? `, Due: ${issue.dueDate}` : ''})${issue.estimatedHours ? `, Est. Hours: ${issue.estimatedHours}` : ''}`
    ).join('\n')
  : 'None'}

You can answer questions such as:
- "Who should I assign task XYZ to?"
- "Who is most experienced with my task XYZ so I can reach out to them for help?"
- "Who is likely to miss their deadline?"
- "How should I prioritize my tasks to finish everything on time?"
- "Predict potential project bottlenecks."
- "Show me all tasks assigned to [name]"
- "What's the workload distribution across the team?"
- "List all bugs in the project"
- "Show me all high-priority tasks"

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

  // Function to extract task assignment suggestions from message
  const extractAssignmentSuggestion = useCallback((message: string): { taskKey: string; assignee: string } | null => {
    console.log("[ChatUI] Checking for assignment suggestion in:", message.substring(0, 100) + "...");
    
    // Look for task key pattern
    const taskKeyMatch = message.match(/([A-Za-z0-9]+-[0-9]+)/i);
    if (!taskKeyMatch) {
      console.log("[ChatUI] No task key found in message");
      return null;
    }
    
    const taskKey = taskKeyMatch[1];
    console.log(`[ChatUI] Found task key: ${taskKey}`);
    
    // Helper function to clean up assignee names
    const cleanAssigneeName = (name: string): string => {
      // Extract just the first name or first and last name (up to two words)
      const nameMatch = name.match(/^(\w+(?:\s+\w+)?)/);
      if (nameMatch) {
        return nameMatch[1];
      }
      
      // If that fails, try to get just the first word
      const firstWordMatch = name.match(/^(\w+)/);
      return firstWordMatch ? firstWordMatch[1] : name;
    };
    
    // Get a list of known team members from issues
    const teamMemberNames = Array.from(new Set(
      issues
        .filter(issue => issue.assignee)
        .map(issue => issue.assignee)
    ));
    
    // First, try to find exact recommendation patterns with the task key
    const exactRecommendationPatterns = [
      new RegExp(`I recommend assigning ${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`recommend assigning ${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`${taskKey}\\s+to\\s+(\\w+(?:\\s+\\w+)?)`, 'i')
    ];
    
    for (const pattern of exactRecommendationPatterns) {
      const match = message.match(pattern);
      if (match) {
        // Try to match with a known team member first
        const rawName = match[1];
        
        // Check if this matches a known team member
        for (const teamMember of teamMemberNames) {
          if (teamMember && 
              (rawName.toLowerCase().includes(teamMember.toLowerCase()) || 
               teamMember.toLowerCase().includes(rawName.toLowerCase()))) {
            console.log(`[ChatUI] Found team member match in recommendation: ${teamMember}`);
            return { taskKey, assignee: teamMember };
          }
        }
        
        // If no team member match, clean the name
        const assignee = cleanAssigneeName(rawName);
        console.log(`[ChatUI] Found exact recommendation match: ${assignee}`);
        return { taskKey, assignee };
      }
    }
    
    // Look for explicit recommendation patterns with high confidence
    const recommendationPatterns = [
      /I recommend assigning (?:[A-Za-z0-9]+-[0-9]+)? to (\w+(?:\s+\w+)?)/i,
      /recommend assigning (?:[A-Za-z0-9]+-[0-9]+)? to (\w+(?:\s+\w+)?)/i,
      /recommend assigning this task to (\w+(?:\s+\w+)?)/i,
      /should be assigned to (\w+(?:\s+\w+)?)/i,
      /assigning (?:[A-Za-z0-9]+-[0-9]+)? to (\w+(?:\s+\w+)?)/i
    ];
    
    for (const pattern of recommendationPatterns) {
      const match = message.match(pattern);
      if (match) {
        // Try to match with a known team member first
        const rawName = match[1];
        
        // Check if this matches a known team member
        for (const teamMember of teamMemberNames) {
          if (teamMember && 
              (rawName.toLowerCase().includes(teamMember.toLowerCase()) || 
               teamMember.toLowerCase().includes(rawName.toLowerCase()))) {
            console.log(`[ChatUI] Found team member match in recommendation: ${teamMember}`);
            return { taskKey, assignee: teamMember };
          }
        }
        
        // If no team member match, clean the name
        const assignee = cleanAssigneeName(rawName);
        console.log(`[ChatUI] Found assignee from recommendation: ${assignee}`);
        return { taskKey, assignee };
      }
    }
    
    // Look for exact team member name matches in the message
    for (const name of teamMemberNames) {
      if (!name) continue;
      
      // Create a regex that matches the name as a whole word
      const nameRegex = new RegExp(`\\b${name}\\b`, 'i');
      if (nameRegex.test(message)) {
        console.log(`[ChatUI] Found exact team member match: ${name}`);
        return { taskKey, assignee: name };
      }
    }
    
    // Look for assignee suggestion patterns
    const assigneePatterns = [
      /recommend\s+(?:assigning\s+)?(?:it|this|task)?\s+to\s+(\w+(?:\s+\w+)?)/i,
      /assign\s+(?:this\s+)?task\s+to\s+(\w+(?:\s+\w+)?)/i,
      /suggest\s+(?:assigning\s+)?(?:it|this|task)?\s+to\s+(\w+(?:\s+\w+)?)/i,
      /should\s+be\s+assigned\s+to\s+(\w+(?:\s+\w+)?)/i,
      /best\s+(?:person|candidate|assignee)\s+(?:would\s+be|is)\s+(\w+(?:\s+\w+)?)/i,
      /I recommend assigning [A-Za-z0-9]+-[0-9]+ to\s+(\w+(?:\s+\w+)?)/i,
      /assigning [A-Za-z0-9]+-[0-9]+ to\s+(\w+(?:\s+\w+)?)/i,
      /assigning this task to\s+(\w+(?:\s+\w+)?)/i,
      /recommend assigning this task to\s+(\w+(?:\s+\w+)?)/i
    ];
    
    for (const pattern of assigneePatterns) {
      const match = message.match(pattern);
      if (match) {
        const assignee = cleanAssigneeName(match[1]);
        console.log(`[ChatUI] Found assignee: ${assignee} using pattern: ${pattern}`);
        return { taskKey, assignee };
      }
    }
    
    // If we found a task key but no assignee with the patterns above,
    // try a more aggressive approach by looking for any name after "to" within a reasonable distance
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('assign') || 
          line.toLowerCase().includes('suggest')) {
        
        const toMatch = line.match(/to\s+(\w+(?:\s+\w+)?)/i);
        if (toMatch) {
          const assignee = cleanAssigneeName(toMatch[1]);
          console.log(`[ChatUI] Found assignee using fallback method: ${assignee}`);
          return { taskKey, assignee };
        }
      }
    }
    
    // As a last resort, look for any name after "to" in the entire message
    const toMatch = message.match(/to\s+(\w+(?:\s+\w+)?)/i);
    if (toMatch) {
      const assignee = cleanAssigneeName(toMatch[1]);
      console.log(`[ChatUI] Found assignee using last resort method: ${assignee}`);
      return { taskKey, assignee };
    }
    
    console.log("[ChatUI] No assignee found in message");
    return null;
  }, [issues]);

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
                "flex flex-col rounded-lg px-4 py-2",
                message.role === "user" 
                  ? "ml-auto bg-primary text-primary-foreground max-w-[80%]" 
                  : "bg-muted text-foreground max-w-[90%]",
              )}
            >
              {message.role === "assistant" ? (
                <>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                  
                  {/* Add task assignment button if suggestion is found */}
                  {(() => {
                    // First check if the last user message was about task assignment
                    const lastUserMessage = messages
                      .filter(m => m.role === 'user')
                      .slice(-1)[0]?.content || '';
                    
                    // Get the previous user message to check for context
                    const previousUserMessages = messages
                      .filter(m => m.role === 'user')
                      .slice(-2);
                    
                    const previousUserMessage = previousUserMessages.length > 1 ? previousUserMessages[0]?.content || '' : '';
                    
                    // Check if this is a direct task assignment query
                    const isTaskAssignmentQuery = /whom\s+should\s+I\s+assign|who\s+should.*be\s+assigned|assign\s+task|assign\s+[A-Za-z0-9]+-[0-9]+\s+to|recommend.*for\s+task|recommend.*for\s+[A-Za-z0-9]+-[0-9]+/i.test(lastUserMessage);
                    
                    // Check if this is a follow-up to a task assignment query
                    const isPreviousTaskAssignmentQuery = /whom\s+should\s+I\s+assign|who\s+should.*be\s+assigned|assign\s+task|assign\s+[A-Za-z0-9]+-[0-9]+\s+to|recommend.*for\s+task|recommend.*for\s+[A-Za-z0-9]+-[0-9]+/i.test(previousUserMessage);
                    
                    // Check if this is a follow-up mentioning a person or expressing preference
                    const isAssigneeFollowUp = /assign\s+to|I\s+want\s+to\s+assign\s+to|assign\s+it\s+to|what\s+about|how\s+about|instead\s+of|prefer|rather|choose/i.test(lastUserMessage);
                    
                    // Check if the message contains a name
                    const containsName = /\b(?:Daksh|Varad|Aryan|Jalin|Siddharth|Anirudh|Prajapati|Parte|Patel|Maheshwari|Sharma|Solankee)\b/i.test(lastUserMessage);
                    
                    // Show the button if it's a direct query or a relevant follow-up
                    const shouldShowButton = isTaskAssignmentQuery || 
                                           (isPreviousTaskAssignmentQuery && (isAssigneeFollowUp || containsName));
                    
                    if (!shouldShowButton) {
                      return null;
                    }
                    
                    console.log("[ChatUI] Task assignment context detected:", { 
                      isTaskAssignmentQuery, 
                      isPreviousTaskAssignmentQuery, 
                      isAssigneeFollowUp,
                      containsName
                    });
                    
                    // Only then check for assignment suggestion
                    const suggestion = extractAssignmentSuggestion(message.content);
                    return suggestion ? (
                      <TaskAssignmentButton 
                        taskKey={suggestion.taskKey} 
                        assignee={suggestion.assignee} 
                        onAssign={assignTask}
                      />
                    ) : null;
                  })()}
                </>
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

      <form onSubmit={handleSubmit} className="border-t p-4 bg-background/80 backdrop-blur-sm">
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
