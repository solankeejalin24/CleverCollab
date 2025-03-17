import React from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface AutomationButtonProps {
  taskDetails: {
    summary: string;
    description: string;
    issueType?: string;
    assigneeAccountId?: string;
    estimatedHours?: number;
    startDate?: string;
    project?: string;
  };
  onSuccess?: (taskKey: string) => void;
}

export function AutomationButton({ taskDetails, onSuccess }: AutomationButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCreateTask = async () => {
    try {
      setIsLoading(true);
      console.log('Creating task with details:', taskDetails);

      const response = await fetch('/api/jira/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskDetails,
          project: taskDetails.project || 'PN2', // Default to PN2 if not specified
        }),
      });

      const data = await response.json();
      console.log('Task creation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully!', {
        description: `Task ${data.data?.key || ''} has been created in Jira`,
        position: "top-right",
        duration: 4000,
      });

      // Call the onSuccess callback if provided
      if (onSuccess && data.data?.key) {
        onSuccess(data.data.key);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        position: "top-right",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreateTask}
      disabled={isLoading}
      className="mt-2 w-full"
      variant="default"
    >
      {isLoading ? 'Creating Task...' : 'Create Task in Jira'}
    </Button>
  );
} 