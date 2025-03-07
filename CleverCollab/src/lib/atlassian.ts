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
      console.error("Failed to get Atlassian token");
    }
    // console.log("Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting Atlassian token:", error);
    return null;
  }
}

export async function fetchJiraData(endpoint: string) {
  const token = await getAtlassianToken();
  
  if (!token) {
    throw new Error("No Atlassian token available");
  }
  
  const response = await fetch(`https://api.atlassian.com/ex/jira/${process.env.ATLASSIAN_CLOUD_ID}/rest/api/3/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Jira data: ${response.statusText}`);
  }
  
  return response.json();
}