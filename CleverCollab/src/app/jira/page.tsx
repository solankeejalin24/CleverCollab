'use client';

import { useEffect } from 'react';
import { useJira } from '@/hooks/useJira';

export default function JiraPage() {
  const { issues, loading, error, fetchIssues } = useJira();

  useEffect(() => {
    fetchIssues();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Jira Issues</h1>
      <div className="grid gap-4">
        {issues.map((issue) => (
          <div
            key={issue.key}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">{issue.summary}</h2>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {issue.key}
              </span>
            </div>
            <div className="mt-2 text-gray-600">
              <p><strong>Type:</strong> {issue.issueType}</p>
              <p><strong>Status:</strong> {issue.status}</p>
              <p><strong>Assignee:</strong> {issue.assignee}</p>
              {issue.dueDate && (
                <p><strong>Due Date:</strong> {new Date(issue.dueDate).toLocaleDateString()}</p>
              )}
              {issue.parent !== 'No Parent' && (
                <p><strong>Parent:</strong> {issue.parent}</p>
              )}
            </div>
            {issue.description && (
              <div className="mt-4">
                <h3 className="font-semibold">Description:</h3>
                <p className="text-gray-600 whitespace-pre-line">{issue.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 