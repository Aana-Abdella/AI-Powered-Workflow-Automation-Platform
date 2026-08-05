'use client';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark-50">Profile</h1>
        <p className="text-sm text-dark-400">Manage your identity, password, and personal preferences.</p>
      </div>

      <section className="rounded-xl border border-dark-800 bg-dark-900 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded-md border border-dark-700 bg-dark-950 px-3 py-2 text-sm" placeholder="First name" />
          <input className="rounded-md border border-dark-700 bg-dark-950 px-3 py-2 text-sm" placeholder="Last name" />
          <input className="rounded-md border border-dark-700 bg-dark-950 px-3 py-2 text-sm md:col-span-2" placeholder="Email" />
        </div>
      </section>
    </div>
  );
}
