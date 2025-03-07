// src/app/project/[key]/page.tsx
import { JiraIssues } from "@/components/JiraIssues";

export default function ProjectPage({ params }: { params: { key: string } }) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Project: {params.key}</h1>
      <p className="text-gray-500 mb-8">Issues and tasks for this project</p>
      <JiraIssues projectKey={params.key} />
    </div>
  );
}