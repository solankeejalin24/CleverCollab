// src/app/api/jira/projects/route.ts
import { NextResponse } from "next/server";
import { fetchJiraData } from "@/lib/atlassian";

export async function GET() {
  try {
    const projects = await fetchJiraData("project");
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}