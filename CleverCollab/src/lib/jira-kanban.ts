import axios from 'axios';
import { serverEnv } from './env';

// Function to update a Jira issue status
export async function updateJiraIssueStatus(issueKey: string, targetCategory: 'todo' | 'in-progress' | 'done'): Promise<boolean> {
  try {
    console.log(`Updating Jira issue ${issueKey} to ${targetCategory}`);
    
    // Get available transitions
    const transitions = await getAvailableTransitions(issueKey);
    
    if (transitions.length === 0) {
      throw new Error(`No transitions available for issue ${issueKey}`);
    }
    
    // Find a transition based on the target category
    let matchingTransition = null;
    
    if (targetCategory === 'todo') {
      // For "todo", look for transitions that might move backward
      matchingTransition = transitions.find(t => 
        t.name.toLowerCase().includes('backlog') || 
        t.name.toLowerCase().includes('open') ||
        t.name.toLowerCase().includes('todo') ||
        t.name.toLowerCase().includes('to do')
      );
    } else if (targetCategory === 'in-progress') {
      // For "in-progress", look for transitions that start work
      matchingTransition = transitions.find(t => 
        t.name.toLowerCase().includes('progress') || 
        t.name.toLowerCase().includes('start') ||
        t.name.toLowerCase().includes('develop') ||
        t.name.toLowerCase().includes('working')
      );
    } else if (targetCategory === 'done') {
      // For "done", look for transitions that complete work
      matchingTransition = transitions.find(t => 
        t.name.toLowerCase().includes('done') || 
        t.name.toLowerCase().includes('complete') ||
        t.name.toLowerCase().includes('finish') ||
        t.name.toLowerCase().includes('close') ||
        t.name.toLowerCase().includes('resolve')
      );
    }
    
    // If no match found, just use the first transition
    if (!matchingTransition && transitions.length > 0) {
      console.log('No specific matching transition found, using first available transition');
      matchingTransition = transitions[0];
    }

    if (!matchingTransition) {
      throw new Error(`No matching transition found for status category: ${targetCategory}`);
    }

    console.log(`Selected transition for ${issueKey}: ${matchingTransition.name} (ID: ${matchingTransition.id})`);

    // Make the API call to update the issue
    await executeTransition(issueKey, matchingTransition.id);
    
    return true;
  } catch (error) {
    console.error(`Error updating issue ${issueKey}:`, error);
    throw error;
  }
}

// Get available transitions for an issue
async function getAvailableTransitions(issueKey: string): Promise<any[]> {
  try {
    const baseUrl = serverEnv.JIRA_BASE_URL || '';
    if (!baseUrl) {
      throw new Error('Jira base URL is not configured');
    }
    
    // Get the base URL without the search endpoint
    const apiBase = baseUrl.includes('/search') 
      ? baseUrl.substring(0, baseUrl.lastIndexOf('/search'))
      : baseUrl;

    // Construct the transition URL
    const url = `${apiBase}/issue/${issueKey}/transitions?expand=transitions.fields`;
    
    console.log('Getting available transitions from URL:', url);

    // Make the API call to get available transitions
    const response = await axios.get(
      url,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        auth: {
          username: serverEnv.JIRA_USER || '',
          password: serverEnv.JIRA_API_TOKEN || '',
        },
      }
    );

    const transitions = response.data.transitions || [];
    
    // Log detailed information about each transition
    transitions.forEach((transition: any) => {
      console.log(`Transition: ${transition.name} (ID: ${transition.id})`);
      if (transition.to) {
        console.log(`  → To Status: ${transition.to.name} (ID: ${transition.to.id})`);
      }
    });
    
    return transitions;
  } catch (error) {
    console.error(`Error getting transitions for issue ${issueKey}:`, error);
    throw error;
  }
}

// Execute a transition on an issue
async function executeTransition(issueKey: string, transitionId: string): Promise<void> {
  try {
    const baseUrl = serverEnv.JIRA_BASE_URL || '';
    if (!baseUrl) {
      throw new Error('Jira base URL is not configured');
    }
    
    // Get the base URL without the search endpoint
    const apiBase = baseUrl.includes('/search') 
      ? baseUrl.substring(0, baseUrl.lastIndexOf('/search'))
      : baseUrl;

    // Construct the transition URL
    const url = `${apiBase}/issue/${issueKey}/transitions`;
    
    console.log('Executing transition at URL:', url);

    // Make the API call to update the issue
    const response = await axios.post(
      url,
      {
        transition: {
          id: transitionId
        }
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        auth: {
          username: serverEnv.JIRA_USER || '',
          password: serverEnv.JIRA_API_TOKEN || '',
        },
      }
    );

    console.log(`Issue ${issueKey} updated successfully with transition ID ${transitionId}`);
  } catch (error) {
    console.error(`Error executing transition for issue ${issueKey}:`, error);
    throw error;
  }
} 