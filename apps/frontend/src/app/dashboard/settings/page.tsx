'use client';

import { FormEvent, useEffect, useState } from 'react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { adminAPI, apiKeysAPI, authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { pushToast } = useToast();
  const { user, organization, clearAuth } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [latestApiKey, setLatestApiKey] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (user?.role !== 'ADMIN') {
        return;
      }
      try {
        setAdminLoading(true);
        const response = await adminAPI.getUsers({ page: 1, limit: 8 });
        setAdminUsers(response.data.data.items || []);
      } catch {
        pushToast('Failed to load user list', 'error');
      } finally {
        setAdminLoading(false);
      }
    };

    void loadUsers();
  }, [pushToast, user?.role]);

  const onChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setPasswordLoading(true);
      await authAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      pushToast('Password updated', 'success');
    } catch {
      pushToast('Unable to update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onGenerateApiKey = async () => {
    try {
      setApiKeyLoading(true);
      const response = await apiKeysAPI.create(organization?.id || '', { name: 'Settings Key' });
      setLatestApiKey(response.data.data.key || null);
      pushToast('New API key generated', 'success');
    } catch {
      pushToast('API key generation failed', 'error');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const onDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await authAPI.deleteAccount();
      clearAuth();
      pushToast('Account deactivated', 'success');
      window.location.href = '/';
    } catch {
      pushToast('Failed to delete account', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const onToggleUser = async (target: AdminUser) => {
    try {
      await adminAPI.updateUser(target.id, { isActive: !target.isActive });
      setAdminUsers((prev) =>
        prev.map((item) => (item.id === target.id ? { ...item, isActive: !item.isActive } : item))
      );
      pushToast('User status updated', 'success');
    } catch {
      pushToast('Failed to update user status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Settings</h1>
        <p className="text-sm text-slate-400">Security preferences, API key rotation, and account management.</p>
      </div>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">Change Password</h2>
        <form onSubmit={onChangePassword} className="mt-3 space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Current password"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">API Key Management</h2>
        <button onClick={onGenerateApiKey} className="btn-secondary mt-3" disabled={apiKeyLoading}>
          {apiKeyLoading ? 'Generating...' : 'Generate New API Key'}
        </button>
        {latestApiKey ? (
          <code className="mt-3 block rounded bg-slate-900 px-3 py-2 font-mono text-xs text-green-300">{latestApiKey}</code>
        ) : null}
      </section>

      <section className="rounded-xl border border-red-900/40 bg-red-950/20 p-5">
        <h2 className="text-sm font-semibold text-red-300">Danger Zone</h2>
        <p className="mt-2 text-sm text-red-200">Delete your account and revoke access tokens.</p>
        <button onClick={() => setDeleteConfirmOpen(true)} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          Delete Account
        </button>
      </section>

      {user?.role === 'ADMIN' ? (
        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold text-slate-100">Admin: User Controls</h2>
          {adminLoading ? (
            <div className="mt-4 flex h-24 items-center justify-center">
              <Spinner size={24} />
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((item, index) => (
                    <tr key={item.id} className={`${index % 2 === 0 ? 'bg-slate-900/20' : ''} border-t border-slate-700`}>
                      <td className="px-3 py-2 text-slate-200">{item.email}</td>
                      <td className="px-3 py-2 text-slate-300">{item.role}</td>
                      <td className="px-3 py-2 text-slate-300">{item.isActive ? 'Active' : 'Suspended'}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => void onToggleUser(item)}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                        >
                          {item.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <ConfirmModal
        open={deleteConfirmOpen}
        title="Delete Account"
        description="This action deactivates your account and removes access. Continue?"
        confirmLabel="Delete Account"
        loading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void onDeleteAccount()}
      />
    </div>
  );
}
