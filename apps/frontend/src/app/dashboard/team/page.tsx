'use client';

const members = [
  { email: 'admin@acme.com', role: 'Admin', joined: '2026-01-05' },
  { email: 'ops@acme.com', role: 'Member', joined: '2026-01-07' },
];

export default function TeamPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-dark-50">Team</h1>
          <p className="text-sm text-dark-400">Invite teammates and assign organization roles.</p>
        </div>
        <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500">Invite member</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-800 bg-dark-900">
        <table className="w-full text-sm">
          <thead className="bg-dark-900/80 text-dark-400">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.email} className="border-t border-dark-800">
                <td className="px-4 py-3 text-dark-100">{member.email}</td>
                <td className="px-4 py-3 text-dark-300">{member.role}</td>
                <td className="px-4 py-3 text-dark-300">{member.joined}</td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded border border-dark-700 px-2 py-1 text-xs text-dark-300 hover:bg-dark-800">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
