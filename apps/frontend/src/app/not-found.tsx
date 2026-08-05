import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="card-surface w-full max-w-lg p-8 text-center">
        <h1 className="text-[36px] font-semibold text-slate-50">404</h1>
        <p className="mt-3 text-sm text-slate-400">The page you requested does not exist.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
