import Link from 'next/link';

export default function CreateFirstWorkflowStepPage() {
  return (
    <main className="mx-auto max-w-xl p-8 text-dark-50">
      <h1 className="text-2xl font-semibold">Create your first workflow</h1>
      <p className="mt-2 text-dark-400">Launch directly into the visual builder.</p>
      <Link href="/dashboard/workflows/new" className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500">
        Open workflow builder
      </Link>
    </main>
  );
}
