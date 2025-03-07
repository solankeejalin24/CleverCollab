import { NextResponse } from "next/server";
import { getAtlassianToken } from "@/lib/atlassian";

export async function GET() {
  try {
    // Get the Atlassian token
    const token = await getAtlassianToken();
    
    if (!token) {
      return NextResponse.json(
        { 
          error: "Failed to get Atlassian token",
          message: "Please ensure you have:",
          steps: [
            "1. Connected your Atlassian account in Clerk",
            "2. Configured the correct OAuth scopes in your Atlassian app",
            "3. Added the scopes to your Clerk JWT template for Atlassian"
          ]
        },
        { status: 401 }
      );
    }
    
    console.log("Successfully obtained Atlassian token");
    
    // Get the accessible resources for the user
    try {
      const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Atlassian API error (${response.status}): ${errorText}`);
        
        if (response.status === 401) {
          return NextResponse.json(
            {
              error: "Unauthorized - Invalid OAuth Configuration",
              message: "Your Atlassian OAuth configuration needs to be updated.",
              steps: [
                "1. Go to your Atlassian app settings at developer.atlassian.com",
                "2. Enable these OAuth scopes: read:me, read:jira-work, read:jira-user, offline_access",
                "3. Go to your Clerk Dashboard",
                "4. Update your JWT Template for Atlassian with the same scopes",
                "5. Reconnect your Atlassian account in the application"
              ]
            },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { error: `Failed to fetch Atlassian resources: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      const resources = await response.json();
      
      if (!resources || resources.length === 0) {
        return NextResponse.json({
          error: "No Atlassian resources found",
          message: "You don't have access to any Atlassian sites. Make sure you have access to at least one Jira or Confluence site."
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        resources,
        message: "These are your available Atlassian resources. Use the 'id' value as your ATLASSIAN_CLOUD_ID."
      });
    } catch (error: any) {
      console.error("Error fetching Atlassian resources:", error);
      return NextResponse.json(
        { error: "Failed to fetch Atlassian resources", details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in cloud-id route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 