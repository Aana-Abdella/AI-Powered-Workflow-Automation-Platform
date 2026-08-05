'use client';

import { useParams } from 'next/navigation';

export default function WorkflowDetailsPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark-50">Workflow Editor</h1>
          <p className="text-sm text-dark-400">Workflow ID: {params.id}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-dark-700 px-3 py-2 text-sm text-dark-200 hover:bg-dark-800">Save draft</button>
          <button className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-500">Publish</button>
        </div>
      </div>

      <div className="rounded-xl border border-dark-800 bg-dark-900 p-5">
        <h2 className="text-sm font-semibold text-dark-100">Versioning</h2>
        <p className="mt-2 text-sm text-dark-400">Current: v5. Previous versions are stored in `workflow_versions` with diff metadata.</p>
      </div>

      <div className="rounded-xl border border-dark-800 bg-dark-900 p-5">
        <h2 className="text-sm font-semibold text-dark-100">JSON Definition</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-dark-950 p-4 text-xs text-primary-300">
{`{
  "trigger": { "type": "webhook", "config": { "path": "/lead" } },
  "steps": [
    { "id": "a1", "type": "ai", "operation": "summarize" },
    { "id": "h1", "type": "http", "method": "POST" }
  ]
}`}
        </pre>
      </div>
    </div>
  );
}
