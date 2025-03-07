// src/app/api/jira/issues/route.ts
import { NextResponse } from "next/server";
import { fetchJiraData } from "@/lib/atlassian";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectKey = searchParams.get("projectKey");
  
  if (!projectKey) {
    return NextResponse.json(
      { error: "Project key is required" },
      { status: 400 }
    );
  }
  
  try {
    console.log(`Fetching issues for project: ${projectKey}`);
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const issues = await fetchJiraData(`search?jql=${encodeURIComponent(jql)}`);
    return NextResponse.json(issues);
  } catch (error: any) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues", details: error.message },
      { status: 500 }
    );
  }
}