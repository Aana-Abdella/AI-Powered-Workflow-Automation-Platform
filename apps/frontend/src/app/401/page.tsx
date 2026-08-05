import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="card-surface w-full max-w-lg p-8 text-center">
        <h1 className="text-[36px] font-semibold text-slate-50">401</h1>
        <p className="mt-3 text-sm text-slate-400">You need to sign in to access this page.</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Go to Login
        </Link>
      </div>
    </main>
  );
}
