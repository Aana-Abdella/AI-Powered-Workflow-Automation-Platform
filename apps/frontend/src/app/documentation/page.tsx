export default function DocumentationPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10 text-slate-100">
      <h1 className="text-[36px] font-semibold">API Documentation</h1>

      <section className="card-surface p-5">
        <h2 className="text-[22px] font-semibold">Authentication Flow</h2>
        <p className="mt-2 text-sm text-slate-400">
          Register or login to receive a 15-minute access token and a 7-day refresh token (httpOnly cookie). Use bearer auth on protected routes.
        </p>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-[22px] font-semibold">Core Endpoints</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>`POST /api/auth/register`</li>
          <li>`POST /api/auth/login`</li>
          <li>`POST /api/webhook/{'{workflow_key}'}`</li>
          <li>`GET /api/executions`</li>
          <li>`GET /api/analytics/usage`</li>
        </ul>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-[22px] font-semibold">Architecture</h2>
        <p className="mt-2 text-sm text-slate-400">
          Next.js frontend, FastAPI backend, PostgreSQL primary storage, Redis queue backend, Celery worker for async AI summarization.
        </p>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-[22px] font-semibold">Deployment</h2>
        <p className="mt-2 text-sm text-slate-400">
          Frontend deploys to Vercel; backend/worker deploy to Render or Fly.io; PostgreSQL on Neon; Redis on Upstash.
        </p>
      </section>
    </main>
  );
}
