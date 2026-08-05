'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="bg-slate-950 text-slate-50">
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="card-surface w-full max-w-lg p-8 text-center">
            <h1 className="text-[28px] font-semibold">Application Error</h1>
            <p className="mt-3 text-sm text-slate-400">{error.message || 'An unexpected error occurred.'}</p>
            <button onClick={reset} className="btn-primary mt-6">
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
