// src/components/JiraIssues.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
  };
}

interface JiraIssuesProps {
  projectKey: string;
}

export function JiraIssues({ projectKey }: JiraIssuesProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIssues() {
      try {
        const response = await fetch(`/api/jira/issues?projectKey=${projectKey}`);
        if (!response.ok) {
          throw new Error("Failed to fetch issues");
        }
        const data = await response.json();
        setIssues(data.issues || []);
      } catch (err) {
        setError("Error loading issues. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (projectKey) {
      fetchIssues();
    }
  }, [projectKey]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading issues...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (issues.length === 0) {
    return <div className="p-4">No issues found for this project.</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {issues.map((issue) => (
        <Card key={issue.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{issue.fields.summary}</CardTitle>
              <Badge>{issue.fields.status.name}</Badge>
            </div>
            <p className="text-sm text-gray-500">{issue.key}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">{issue.fields.description || "No description"}</p>
              <div className="flex justify-between text-sm">
                <span>Priority: {issue.fields.priority.name}</span>
                <span>
                  Assignee: {issue.fields.assignee?.displayName || "Unassigned"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}