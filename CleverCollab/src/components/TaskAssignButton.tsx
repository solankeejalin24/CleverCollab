// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { toast } from 'sonner';

// interface TaskAssignButtonProps {
//   taskKey: string;
//   assignee: string;
// }

// type ToastType = 'success' | 'error' | 'info' | 'warning';

// export function TaskAssignButton({ taskKey, assignee }: TaskAssignButtonProps) {
//   const [isLoading, setIsLoading] = useState(false);

//   const handleAssign = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/jira/assign-task', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           taskKey,
//           assignee,
//         }),
//       });

//       const data = await response.json();
      
//       // Check for toast notification in headers
//       const showToast = response.headers.get('X-Show-Toast');
//       if (showToast) {
//         try {
//           const toastData = JSON.parse(showToast);
//           const toastType = (toastData.type || 'info') as ToastType;
          
//           // Use the appropriate toast function based on type
//           switch (toastType) {
//             case 'success':
//               toast.success(toastData.message || 'Task assignment processed');
//               break;
//             case 'error':
//               toast.error(toastData.message || 'Task assignment processed');
//               break;
//             case 'warning':
//               toast.warning(toastData.message || 'Task assignment processed');
//               break;
//             default:
//               toast.info(toastData.message || 'Task assignment processed');
//           }
//         } catch (error) {
//           console.error('Error parsing toast data:', error);
//           toast.info('Task assignment processed');
//         }
//       } else {
//         // Fallback toast based on response data
//         if (data.success) {
//           toast.success(`Successfully assigned task ${taskKey} to ${assignee}`);
//         } else {
//           toast.error(`Failed to assign task: ${data.error || 'Unknown error'}`);
//         }
//       }
//     } catch (error) {
//       console.error('Error assigning task:', error);
//       toast.error('Failed to assign task due to an error');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Button 
//       onClick={handleAssign} 
//       disabled={isLoading}
//       variant="default"
//       size="sm"
//     >
//       {isLoading ? 'Assigning...' : `Assign ${taskKey} to ${assignee}`}
//     </Button>
//   );
// } 