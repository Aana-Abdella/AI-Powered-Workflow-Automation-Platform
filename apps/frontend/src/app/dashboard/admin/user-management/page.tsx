'use client';

import { useEffect, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { adminAPI } from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  tenantId: string;
}

export default function UserManagementPage() {
  const { pushToast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getUsers({ page: 1, limit: 50 });
        setRows(response.data.data.items || []);
      } catch {
        pushToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [pushToast]);

  const toggleUser = async (row: UserRow) => {
    try {
      await adminAPI.updateUser(row.id, { isActive: !row.isActive });
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, isActive: !item.isActive } : item)));
      pushToast('User updated', 'success');
    } catch {
      pushToast('Failed to update user', 'error');
    }
  };

  if (loading) {
    return (
      <div className="card-surface flex h-44 items-center justify-center">
        <Spinner size={30} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-50">User Management</h1>
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Tenant</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={`${index % 2 === 0 ? 'bg-slate-900/20' : ''} border-t border-slate-700`}>
                <td className="px-4 py-3 text-slate-100">{row.email}</td>
                <td className="px-4 py-3 text-slate-300">{row.role}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.tenantId}</td>
                <td className="px-4 py-3 text-slate-300">{row.isActive ? 'Active' : 'Suspended'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => void toggleUser(row)}
                    className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    {row.isActive ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
