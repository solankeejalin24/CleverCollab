import { NextResponse } from "next/server";
import { getAtlassianToken, fetchJiraData } from "@/lib/atlassian";

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
    
    // Try to fetch a simple endpoint to test the integration
    try {
      const myself = await fetchJiraData("myself");
      return NextResponse.json({ success: true, user: myself });
    } catch (error) {
      console.error("Error fetching Jira data:", error);
      return NextResponse.json(
        { error: "Failed to fetch Jira data", details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test-atlassian route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
} 