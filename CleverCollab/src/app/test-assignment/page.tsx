"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function TestAssignmentPage() {
  const [taskKey, setTaskKey] = useState('');
  const [assignee, setAssignee] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAssign = async () => {
    if (!taskKey || !assignee) {
      toast.error('Please enter both task key and assignee');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log(`Assigning task ${taskKey} to ${assignee}`);
      
      const response = await fetch('/api/jira/assign-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskKey, assignee }),
      });

      const data = await response.json();
      setResult(data);

      // Check for toast notification in headers
      const showToast = response.headers.get('X-Show-Toast');
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
              toast.error(toastData.message || 'Task assignment failed');
              break;
            case 'warning':
              toast.warning(toastData.message || 'Task assignment warning');
              break;
            default:
              toast.info(toastData.message || 'Task assignment processed');
          }
        } catch (error) {
          console.error('Error parsing toast data:', error);
          
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
    } catch (error) {
      console.error('Error assigning task:', error);
      setResult({ error: 'Failed to assign task due to an error' });
      toast.error('Failed to assign task due to an error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Task Assignment</h1>
      
      <div className="grid gap-4 max-w-md">
        <div className="grid gap-2">
          <Label htmlFor="taskKey">Task Key (e.g., PN2-13)</Label>
          <Input
            id="taskKey"
            value={taskKey}
            onChange={(e) => setTaskKey(e.target.value)}
            placeholder="Enter task key"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="assignee">Assignee (name, email, or ID)</Label>
          <Input
            id="assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Enter assignee"
          />
        </div>
        
        <Button 
          onClick={handleAssign} 
          disabled={loading || !taskKey || !assignee}
          className="mt-2"
        >
          {loading ? 'Assigning...' : 'Assign Task'}
        </Button>
      </div>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-w-2xl">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 