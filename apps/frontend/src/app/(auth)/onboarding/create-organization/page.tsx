export default function CreateOrganizationStepPage() {
  return (
    <main className="mx-auto max-w-xl p-8 text-dark-50">
      <h1 className="text-2xl font-semibold">Create organization</h1>
      <div className="mt-4 space-y-3">
        <input className="w-full rounded-md border border-dark-700 bg-dark-900 px-3 py-2" placeholder="Organization name" />
        <input className="w-full rounded-md border border-dark-700 bg-dark-900 px-3 py-2" placeholder="Organization slug" />
        <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500">Continue</button>
      </div>
    </main>
  );
}
