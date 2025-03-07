import { NextResponse } from "next/server";
import { getAtlassianToken, getAtlassianCloudId, fetchJiraData } from "@/lib/atlassian";

export async function GET() {
  try {
    // Get the Atlassian token
    const token = await getAtlassianToken();
    
    if (!token) {
      return NextResponse.json(
        { error: "Failed to get Atlassian token" },
        { status: 401 }
      );
    }
    
    console.log("Successfully obtained Atlassian token");
    
    // Try to get the Cloud ID
    let cloudId;
    try {
      cloudId = await getAtlassianCloudId();
      console.log(`Successfully retrieved Cloud ID: ${cloudId}`);
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: "Failed to get Atlassian Cloud ID", 
          details: error.message,
          message: "Please visit /api/atlassian/cloud-id to get your Cloud ID"
        },
        { status: 500 }
      );
    }
    
    // Try to fetch a simple endpoint to test the integration
    try {
      const myself = await fetchJiraData("myself");
      return NextResponse.json({ 
        success: true, 
        user: myself,
        cloudId,
        message: "Your Atlassian integration is working correctly!"
      });
    } catch (error: any) {
      console.error("Error fetching Jira data:", error);
      return NextResponse.json(
        { error: "Failed to fetch Jira data", details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in test-atlassian route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 