import Link from 'next/link';

export default function DashboardDocumentationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Documentation</h1>
        <p className="text-sm text-slate-400">Developer references for API usage, deployment, and architecture.</p>
      </div>

      <div className="card-surface p-5">
        <h2 className="text-lg font-semibold">API Quick Links</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>`POST /api/auth/register`</li>
          <li>`POST /api/workflows`</li>
          <li>`POST /api/webhook/{'{workflow_key}'}`</li>
          <li>`GET /api/executions`</li>
          <li>`GET /api/analytics/usage`</li>
        </ul>
      </div>

      <Link href="/documentation" className="btn-primary inline-flex">
        Open Full Docs
      </Link>
    </div>
  );
}
