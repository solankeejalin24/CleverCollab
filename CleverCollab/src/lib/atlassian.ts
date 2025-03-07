// src/lib/atlassian.ts
import { auth } from "@clerk/nextjs/server";

export async function getAtlassianToken() {
  try {
    const session = await auth();
    
    if (!session || !session.userId) {
      console.error("No authenticated session found");
      return null;
    }
    
    const token = await session.getToken({ template: "atlassian" });
    
    if (!token) {
      console.error("Failed to get Atlassian token. Please ensure you have configured the Atlassian OAuth scopes in your Clerk Dashboard.");
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error getting Atlassian token:", error);
    return null;
  }
}

export async function getAtlassianCloudId() {
  const token = await getAtlassianToken();
  
  if (!token) {
    console.error("No Atlassian token available");
    throw new Error("No Atlassian token available");
  }
  
  try {
    // First, get the accessible resources for the user
    const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Atlassian API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch Atlassian resources: ${response.status} ${response.statusText}`);
    }
    
    const resources = await response.json();
    
    if (!resources || resources.length === 0) {
      throw new Error('No Atlassian resources available for this user');
    }
    
    // Return the ID of the first resource (usually there's only one for most users)
    return resources[0].id;
  } catch (error) {
    console.error('Error getting Atlassian Cloud ID:', error);
    throw error;
  }
}

export async function fetchJiraData(endpoint: string) {
  const token = await getAtlassianToken();
  
  if (!token) {
    console.error("No Atlassian token available");
    throw new Error("No Atlassian token available");
  }
  
  // Get the cloud ID dynamically or use the one from environment variables
  let cloudId;
  try {
    cloudId = await getAtlassianCloudId();
    console.log(`Using dynamically retrieved Cloud ID: ${cloudId}`);
  } catch (error) {
    console.warn('Failed to get Cloud ID dynamically, falling back to environment variable');
    cloudId = process.env.ATLASSIAN_CLOUD_ID;
  }
  
  if (!cloudId) {
    throw new Error('No Atlassian Cloud ID available');
  }
  
  const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/${endpoint}`;
  console.log(`Fetching Jira data from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jira API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch Jira data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in fetchJiraData:", error);
    throw error;
  }
}