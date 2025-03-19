"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FormEvent, useRef, useEffect, useCallback, useState } from "react"
import { Send, Trash2, Loader2, Mail } from 'lucide-react'
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
import { TeamMemberSelect } from "./TeamMemberSelect"

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
  const [selectedAssigneeName, setSelectedAssigneeName] = useState(assignee);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle team member selection change
  const handleTeamMemberChange = (id: string, name: string) => {
    setSelectedAssigneeId(id);
    setSelectedAssigneeName(name);
  };
  
  const handleAssign = () => {
    setIsLoading(true);
    
    // Use the selected assignee ID if available, otherwise use the name
    const assigneeToUse = selectedAssigneeId || selectedAssigneeName;
    
    onAssign(taskKey, assigneeToUse);
    setIsLoading(false);
  };
  
  return (
    <div className="mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium">Assign Task</div>
        <div className="grid grid-cols-[1fr,2fr] gap-1 items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Task Key:</div>
          <div className="text-xs font-medium">{taskKey}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Assignee:</div>
          <div className="text-xs">
            <TeamMemberSelect
              selectedMemberId={selectedAssigneeId}
              selectedMemberName={selectedAssigneeName}
              onTeamMemberChange={handleTeamMemberChange}
              disabled={isLoading}
            />
          </div>
        </div>
        <button 
          onClick={handleAssign}
          className="mt-1 w-full bg-[#a4cb6a] hover:bg-[#a4cb6a]/80 text-white hover:text-white transition-colors py-1 px-2 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !selectedAssigneeName}
        >
          {isLoading ? 'Assigning...' : `Confirm Assignment`}
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
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
    
    console.log("[ChatUI] Known team members:", teamMemberNames);
    
    // Check for explicit reassignment patterns first (these often have the clearest assignee mention)
    const reassignmentPatterns = [
      new RegExp(`(?:reassign|transfer|move|change\\s+assignee\\s+of)\\s+${taskKey}\\s+(?:to|from\\s+\\w+\\s+to)\\s+(\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`${taskKey}\\s+(?:should|could|can)\\s+be\\s+reassigned\\s+to\\s+(\\w+(?:\\s+\\w+)?)`, 'i'),
      /reassign\s+(?:task\s+)?([A-Za-z0-9]+-[0-9]+)?\s+to\s+(\w+(?:\s+\w+)?)/i,
      /change\s+assignee\s+(?:of\s+)?(?:task\s+)?([A-Za-z0-9]+-[0-9]+)?\s+to\s+(\w+(?:\s+\w+)?)/i
    ];
    
    for (const pattern of reassignmentPatterns) {
      const match = message.match(pattern);
      if (match) {
        let assignee;
        // Handle different pattern structures
        if (match.length > 2 && match[2]) {
          // For patterns that capture both task key and assignee in groups
          assignee = cleanAssigneeName(match[2]);
        } else if (match.length > 1) {
          // For patterns that capture only assignee
          assignee = cleanAssigneeName(match[1]);
        } else {
          continue;
        }
        
        // Try to match with a known team member
        const bestTeamMemberMatch = findBestTeamMemberMatch(assignee, teamMemberNames);
        if (bestTeamMemberMatch) {
          console.log(`[ChatUI] Found team member from reassignment pattern: ${bestTeamMemberMatch}`);
          return { taskKey, assignee: bestTeamMemberMatch };
        }
        
        console.log(`[ChatUI] Found assignee from reassignment pattern: ${assignee}`);
        return { taskKey, assignee };
      }
    }
    
    // First, try to find exact recommendation patterns with the task key
    const exactRecommendationPatterns = [
      new RegExp(`I recommend (?:assigning|reassigning) ${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`recommend (?:assigning|reassigning) ${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`${taskKey} (?:should be|could be) (?:assigned|reassigned) to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`${taskKey}\\s+to\\s+(\\w+(?:\\s+\\w+)?)`, 'i'),
      new RegExp(`(?:reassign|transfer|move) ${taskKey} to (\\w+(?:\\s+\\w+)?)`, 'i')
    ];
    
    for (const pattern of exactRecommendationPatterns) {
      const match = message.match(pattern);
      if (match) {
        // Get the raw assignee name
        const rawName = match[1];
        
        // Try to find best team member match
        const bestTeamMemberMatch = findBestTeamMemberMatch(rawName, teamMemberNames);
        if (bestTeamMemberMatch) {
          console.log(`[ChatUI] Found team member match in recommendation: ${bestTeamMemberMatch}`);
          return { taskKey, assignee: bestTeamMemberMatch };
        }
        
        // If no team member match, clean the name
        const assignee = cleanAssigneeName(rawName);
        console.log(`[ChatUI] Found exact recommendation match: ${assignee}`);
        return { taskKey, assignee };
      }
    }
    
    // Look for explicit recommendation patterns with high confidence
    const recommendationPatterns = [
      /I recommend (?:assigning|reassigning) (?:[A-Za-z0-9]+-[0-9]+)? to (\w+(?:\s+\w+)?)/i,
      /recommend (?:assigning|reassigning) (?:[A-Za-z0-9]+-[0-9]+)? to (\w+(?:\s+\w+)?)/i,
      /recommend (?:assigning|reassigning) this task to (\w+(?:\s+\w+)?)/i,
      /should be (?:assigned|reassigned) to (\w+(?:\s+\w+)?)/i,
      /could be (?:assigned|reassigned) to (\w+(?:\s+\w+)?)/i,
      /(?:assigning|reassigning) (?:[A-Za-z0-9]+-[0-9]+)? to (\w+(?:\s+\w+)?)/i,
      /(?:reassign|transfer|move) (?:it|this task|[A-Za-z0-9]+-[0-9]+) to (\w+(?:\s+\w+)?)/i
    ];
    
    for (const pattern of recommendationPatterns) {
      const match = message.match(pattern);
      if (match) {
        // Get the raw assignee name
        const rawName = match[1];
        
        // Try to find best team member match
        const bestTeamMemberMatch = findBestTeamMemberMatch(rawName, teamMemberNames);
        if (bestTeamMemberMatch) {
          console.log(`[ChatUI] Found team member match in recommendation: ${bestTeamMemberMatch}`);
          return { taskKey, assignee: bestTeamMemberMatch };
        }
        
        // If no team member match, clean the name
        const assignee = cleanAssigneeName(rawName);
        console.log(`[ChatUI] Found assignee from recommendation: ${assignee}`);
        return { taskKey, assignee };
      }
    }
    
    // Check if a specific team member is mentioned near the task key
    const nearbyNamePattern = new RegExp(`${taskKey}\\s+(?:\\w+\\s+){0,5}(${teamMemberNames.join('|')})`, 'i');
    const nearbyMatch = message.match(nearbyNamePattern);
    if (nearbyMatch) {
      console.log(`[ChatUI] Found team member mentioned near task key: ${nearbyMatch[1]}`);
      return { taskKey, assignee: nearbyMatch[1] };
    }
    
    // Look for assignee suggestion patterns
    const assigneePatterns = [
      /recommend\s+(?:assigning|reassigning)\s+(?:it|this|task)?\s+to\s+(\w+(?:\s+\w+)?)/i,
      /(?:assign|reassign)\s+(?:this\s+)?task\s+to\s+(\w+(?:\s+\w+)?)/i,
      /suggest\s+(?:assigning|reassigning)\s+(?:it|this|task)?\s+to\s+(\w+(?:\s+\w+)?)/i,
      /should\s+be\s+(?:assigned|reassigned)\s+to\s+(\w+(?:\s+\w+)?)/i,
      /best\s+(?:person|candidate|assignee)\s+(?:would\s+be|is)\s+(\w+(?:\s+\w+)?)/i,
      /I recommend (?:assigning|reassigning) [A-Za-z0-9]+-[0-9]+ to\s+(\w+(?:\s+\w+)?)/i,
      /(?:assigning|reassigning) [A-Za-z0-9]+-[0-9]+ to\s+(\w+(?:\s+\w+)?)/i,
      /(?:assigning|reassigning) this task to\s+(\w+(?:\s+\w+)?)/i,
      /recommend (?:assigning|reassigning) this task to\s+(\w+(?:\s+\w+)?)/i,
      /(?:transfer|move|reassign) (?:it|this task) to\s+(\w+(?:\s+\w+)?)/i
    ];
    
    for (const pattern of assigneePatterns) {
      const match = message.match(pattern);
      if (match) {
        // Get the raw assignee name
        const rawName = match[1];
        
        // Try to find best team member match
        const bestTeamMemberMatch = findBestTeamMemberMatch(rawName, teamMemberNames);
        if (bestTeamMemberMatch) {
          console.log(`[ChatUI] Found team member match in assignee pattern: ${bestTeamMemberMatch}`);
          return { taskKey, assignee: bestTeamMemberMatch };
        }
        
        // If no team member match, clean the name
        const assignee = cleanAssigneeName(rawName);
        console.log(`[ChatUI] Found assignee: ${assignee} using pattern: ${pattern}`);
        return { taskKey, assignee };
      }
    }
    
    // Check all team members to see if any are mentioned in the message
    for (const name of teamMemberNames) {
      if (!name) continue;
      
      // Create a regex that matches the name as a whole word
      const nameRegex = new RegExp(`\\b${name}\\b`, 'i');
      if (nameRegex.test(message)) {
        // Check if the name is within a reasonable distance of relevant keywords
        const relevantSentences = message.split(/[.!?]+/).filter(sentence => 
          sentence.includes(taskKey) || 
          /assign|reassign|task|should|recommend|suggest|best|move|transfer/i.test(sentence)
        );
        
        for (const sentence of relevantSentences) {
          if (nameRegex.test(sentence)) {
            console.log(`[ChatUI] Found team member ${name} in relevant context`);
            return { taskKey, assignee: name };
          }
        }
        
        console.log(`[ChatUI] Found exact team member match: ${name}`);
        return { taskKey, assignee: name };
      }
    }
    
    // If we found a task key but no assignee with the patterns above,
    // try a more aggressive approach by looking for any name after "to" within a reasonable distance
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(taskKey.toLowerCase()) || 
          line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('assign') || 
          line.toLowerCase().includes('reassign') || 
          line.toLowerCase().includes('suggest')) {
        
        const toMatch = line.match(/to\s+(\w+(?:\s+\w+)?)/i);
        if (toMatch) {
          const rawName = toMatch[1];
          
          // Try to find best team member match
          const bestTeamMemberMatch = findBestTeamMemberMatch(rawName, teamMemberNames);
          if (bestTeamMemberMatch) {
            console.log(`[ChatUI] Found team member in fallback method: ${bestTeamMemberMatch}`);
            return { taskKey, assignee: bestTeamMemberMatch };
          }
          
          const assignee = cleanAssigneeName(rawName);
          console.log(`[ChatUI] Found assignee using fallback method: ${assignee}`);
          return { taskKey, assignee };
        }
      }
    }
    
    // As a last resort, look for any name after "to" in the entire message near the task key
    const taskKeyContext = message.substr(
      Math.max(0, message.indexOf(taskKey) - 100), 
      Math.min(message.length, message.indexOf(taskKey) + 200)
    );
    
    const toMatch = taskKeyContext.match(/to\s+(\w+(?:\s+\w+)?)/i);
    if (toMatch) {
      const rawName = toMatch[1];
      
      // Try to find best team member match
      const bestTeamMemberMatch = findBestTeamMemberMatch(rawName, teamMemberNames);
      if (bestTeamMemberMatch) {
        console.log(`[ChatUI] Found team member in last resort method: ${bestTeamMemberMatch}`);
        return { taskKey, assignee: bestTeamMemberMatch };
      }
      
      const assignee = cleanAssigneeName(rawName);
      console.log(`[ChatUI] Found assignee using last resort method: ${assignee}`);
      return { taskKey, assignee };
    }
    
    // If we really can't find an assignee, check the whole message for any team member and use the first one
    for (const name of teamMemberNames) {
      if (!name) continue;
      if (message.toLowerCase().includes(name.toLowerCase())) {
        console.log(`[ChatUI] Using last resort team member match: ${name}`);
        return { taskKey, assignee: name };
      }
    }
    
    console.log("[ChatUI] No assignee found in message");
    return null;
  }, [issues]);
  
  // Helper function to find the best team member match from a name
  const findBestTeamMemberMatch = (name: string, teamMemberNames: string[]): string | null => {
    if (!name || !teamMemberNames.length) return null;
    
    const normalizedName = name.toLowerCase();
    
    // First try for exact match
    for (const teamMember of teamMemberNames) {
      if (teamMember && teamMember.toLowerCase() === normalizedName) {
        return teamMember; // Return exact match
      }
    }
    
    // Then try for containment in either direction
    for (const teamMember of teamMemberNames) {
      if (teamMember && (
        normalizedName.includes(teamMember.toLowerCase()) || 
        teamMember.toLowerCase().includes(normalizedName)
      )) {
        return teamMember; // Return match where one contains the other
      }
    }
    
    // If still no match, check for first name matches
    const firstName = normalizedName.split(' ')[0];
    for (const teamMember of teamMemberNames) {
      if (teamMember && teamMember.toLowerCase().startsWith(firstName)) {
        return teamMember; // Return member whose first name matches
      }
    }
    
    // Last resort, check if any word in the team member name matches any word in the input
    const nameWords = normalizedName.split(/\s+/);
    for (const word of nameWords) {
      if (word.length < 3) continue; // Skip short words
      
      for (const teamMember of teamMemberNames) {
        if (!teamMember) continue;
        
        const memberWords = teamMember.toLowerCase().split(/\s+/);
        for (const memberWord of memberWords) {
          if (memberWord.includes(word) || word.includes(memberWord)) {
            return teamMember; // Return member with matching word part
          }
        }
      }
    }
    
    return null; // No match found
  };

  // Function to send chat transcript via email
  const sendChatTranscript = async () => {
    if (messages.length <= 1) {
      toast.info('No chat messages to send');
      return;
    }
    
    try {
      setIsSendingEmail(true);
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          subject: 'CleverCollab Chat Transcript'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      toast.success('Chat transcript sent to your email');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full border border-gray-300 dark:border-gray-700 rounded-lg shadow-md overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 px-4 py-3 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="font-semibold">Project Management Assistant</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={sendChatTranscript} 
            aria-label="Send chat transcript to email"
            className="hover:bg-[#64c6c4]/10 hover:text-[#64c6c4]"
            disabled={isLoading || isSendingEmail || messages.length <= 1}
          >
            {isSendingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </Button>
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
      </div>

      <ScrollArea className="flex-1 border-y border-gray-200 dark:border-gray-800" scrollHideDelay={100} type="always">
        <div className="flex flex-col gap-4 p-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col rounded-lg px-4 py-2 shadow-sm",
                message.role === "user" 
                  ? "ml-auto bg-[#64c6c4] text-white max-w-[80%] border border-[#64c6c4]/20" 
                  : "bg-muted text-foreground max-w-[90%] border border-gray-200 dark:border-gray-800",
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
                    
                    // Check if this is a direct task assignment or reassignment query
                    const isTaskAssignmentQuery = /whom\s+should\s+I\s+(?:assign|reassign)|who\s+should.*be\s+(?:assigned|reassigned)|(?:assign|reassign)\s+task|(?:assign|reassign)\s+[A-Za-z0-9]+-[0-9]+\s+to|recommend.*for\s+task|recommend.*for\s+[A-Za-z0-9]+-[0-9]+|(?:reassign|change\s+assignee\s+for)\s+[A-Za-z0-9]+-[0-9]+|(?:transfer|move)\s+task|(?:transfer|move)\s+[A-Za-z0-9]+-[0-9]+/i.test(lastUserMessage);
                    
                    // Check if this is a follow-up to a task assignment query
                    const isPreviousTaskAssignmentQuery = /whom\s+should\s+I\s+(?:assign|reassign)|who\s+should.*be\s+(?:assigned|reassigned)|(?:assign|reassign)\s+task|(?:assign|reassign)\s+[A-Za-z0-9]+-[0-9]+\s+to|recommend.*for\s+task|recommend.*for\s+[A-Za-z0-9]+-[0-9]+|(?:reassign|change\s+assignee\s+for)\s+[A-Za-z0-9]+-[0-9]+|(?:transfer|move)\s+task|(?:transfer|move)\s+[A-Za-z0-9]+-[0-9]+/i.test(previousUserMessage);
                    
                    // Check if this is a follow-up mentioning a person or expressing preference
                    const isAssigneeFollowUp = /(?:assign|reassign)\s+to|I\s+want\s+to\s+(?:assign|reassign)\s+to|(?:assign|reassign)\s+it\s+to|what\s+about|how\s+about|instead\s+of|prefer|rather|choose|move\s+to|transfer\s+to/i.test(lastUserMessage);
                    
                    // Check if the message contains a task key
                    const containsTaskKey = /[A-Za-z0-9]+-[0-9]+/i.test(lastUserMessage);
                    
                    // Check if the message contains a name
                    const containsName = /\b(?:Daksh|Varad|Aryan|Jalin|Siddharth|Anirudh|Prajapati|Parte|Patel|Maheshwari|Sharma|Solankee)\b/i.test(lastUserMessage);
                    
                    // Check if the bot's response contains phrases about reassignment
                    const containsReassignmentSuggestion = /(?:reassign|change assignee|transfer|move)\s+[A-Za-z0-9]+-[0-9]+|should\s+be\s+reassigned/i.test(message.content);
                    
                    // Show the button if it's a direct query, a relevant follow-up, or contains reassignment suggestion
                    const shouldShowButton = isTaskAssignmentQuery || 
                                           (isPreviousTaskAssignmentQuery && (isAssigneeFollowUp || containsName)) ||
                                           (containsTaskKey && (containsName || isAssigneeFollowUp)) ||
                                           containsReassignmentSuggestion;
                    
                    if (!shouldShowButton) {
                      return null;
                    }
                    
                    console.log("[ChatUI] Task assignment context detected:", { 
                      isTaskAssignmentQuery, 
                      isPreviousTaskAssignmentQuery, 
                      isAssigneeFollowUp,
                      containsName,
                      containsTaskKey,
                      containsReassignmentSuggestion
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
            <div className="flex items-center gap-2 bg-muted text-foreground rounded-lg px-4 py-2 max-w-[80%] border border-gray-200 dark:border-gray-800 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t border-gray-300 dark:border-gray-700 p-4 bg-background/80 backdrop-blur-sm">
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
