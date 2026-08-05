'use client';

import { FormEvent, useEffect, useState } from 'react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { apiKeysAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ApiKeyItem {
  id: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { pushToast } = useToast();
  const organization = useAuthStore((state) => state.organization);

  const [items, setItems] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('Primary Key');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadKeys = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiKeysAPI.list(organization.id);
      setItems(response.data.data || []);
    } catch {
      pushToast('Failed to load API keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setCreating(true);
      if (!organization?.id) {
        throw new Error('missing org');
      }
      const response = await apiKeysAPI.create(organization.id, { name });
      setNewKey(response.data.data.key || response.data.data.rawKey || null);
      pushToast('API key generated', 'success');
      await loadKeys();
    } catch {
      pushToast('Failed to create API key', 'error');
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = async () => {
    if (!revokeTarget) {
      return;
    }

    try {
      setRevoking(true);
      if (!organization?.id) {
        throw new Error('missing org');
      }
      await apiKeysAPI.revoke(organization.id, revokeTarget.id);
      pushToast('API key revoked', 'success');
      setRevokeTarget(null);
      await loadKeys();
    } catch {
      pushToast('Unable to revoke API key', 'error');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">API Keys</h1>
          <p className="text-sm text-slate-400">Generate and manage tenant-scoped API credentials.</p>
        </div>
      </div>

      <form onSubmit={onCreate} className="card-surface flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-64 flex-1">
          <label className="block text-sm font-medium text-slate-300">Key Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Production key"
            disabled={creating}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Generating...' : 'Generate Key'}
        </button>
      </form>

      {newKey ? (
        <div className="rounded-xl border border-green-900/40 bg-green-950/25 p-4">
          <p className="text-sm text-green-200">Copy this API key now. It will not be shown again.</p>
          <code className="mt-2 block rounded bg-slate-950 px-3 py-2 font-mono text-xs text-green-300">{newKey}</code>
        </div>
      ) : null}

      {loading ? (
        <div className="card-surface flex h-44 items-center justify-center">
          <Spinner size={30} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Key Prefix</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item, index) => (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-slate-900/20' : ''} border-t border-slate-700`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-100">{item.keyPrefix}********</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${item.isActive ? 'bg-green-900/40 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                        {item.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRevokeTarget(item)}
                        disabled={!item.isActive || revoking}
                        className="rounded-md border border-red-800/60 px-2 py-1 text-xs text-red-300 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={4}>
                    No API keys yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(revokeTarget)}
        title="Revoke API Key"
        description="This key will stop working immediately for all integrations."
        confirmLabel="Revoke"
        loading={revoking}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => void onRevoke()}
      />
    </div>
  );
}
