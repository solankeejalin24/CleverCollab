import React, { useState } from 'react';
import { toast } from 'sonner';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [automationMetadata, setAutomationMetadata] = useState(null);
  const [session, setSession] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      setIsLoading(true);
      
      // Prepare the request body
      const requestBody = {
        messages: [...messages, userMessage],
        automationContext: automationMetadata,
        userEmail: session?.user?.emailAddresses?.[0]?.emailAddress
      };
      
      console.log('Sending request to chat API:', requestBody);
      
      // Send the request to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Check for automation metadata in response headers
      const automationAvailable = response.headers.get('X-Automation-Available') === 'true';
      const showToast = response.headers.get('X-Show-Toast');
      
      // Handle toast notifications
      if (showToast) {
        try {
          const toastData = JSON.parse(showToast);
          const toastType = (toastData.type || 'info') as 'success' | 'error' | 'info' | 'warning';
          
          // Use the appropriate toast function based on type
          switch (toastType) {
            case 'success':
              toast.success(toastData.message || 'Task assignment processed');
              break;
            case 'error':
              toast.error(toastData.message || 'Task assignment processed');
              break;
            case 'warning':
              toast.warning(toastData.message || 'Task assignment processed');
              break;
            default:
              toast.info(toastData.message || 'Task assignment processed');
          }
        } catch (error) {
          console.error('Error parsing toast data:', error);
          toast.info('Task assignment processed');
        }
      }
      
      // Process automation metadata if available
      if (automationAvailable) {
        const metadataHeader = response.headers.get('X-Automation-Metadata');
        if (metadataHeader) {
          try {
            const metadata = JSON.parse(metadataHeader);
            setAutomationMetadata(metadata);
            console.log('Received automation metadata:', metadata);
          } catch (error) {
            console.error('Error parsing automation metadata:', error);
          }
        }
      } else {
        // Clear automation metadata if not available
        setAutomationMetadata(null);
      }

      // ... rest of the existing code ...
    } catch (error) {
      console.error('Error submitting message:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Render your input component here */}
    </div>
  );
};

export default ChatInput; 