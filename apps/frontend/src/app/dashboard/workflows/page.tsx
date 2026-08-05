'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { workflowAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface WorkflowItem {
  id: string;
  name: string;
  isActive: boolean;
  webhookKey: string;
  createdAt: string;
}

function normalizeWorkflow(raw: any): WorkflowItem {
  return {
    id: raw.id,
    name: raw.name || 'Untitled Workflow',
    isActive: Boolean(raw.isActive ?? raw.isEnabled),
    webhookKey: raw.webhookKey || raw.webhookToken || '',
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export default function WorkflowsPage() {
  const { pushToast } = useToast();
  const organization = useAuthStore((state) => state.organization);

  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowItem | null>(null);

  const loadWorkflows = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await workflowAPI.list(organization.id);
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      setItems(rows.map(normalizeWorkflow));
    } catch {
      pushToast('Failed to load workflows', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      const matchesStatus =
        status === 'all' || (status === 'active' ? item.isActive : !item.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [items, query, status]);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const toggleWorkflow = async (workflow: WorkflowItem) => {
    try {
      setPendingActionId(workflow.id);
      if (workflow.isActive) {
        await workflowAPI.disable(workflow.id);
        pushToast('Workflow disabled', 'success');
      } else {
        await workflowAPI.enable(workflow.id);
        pushToast('Workflow enabled', 'success');
      }
      await loadWorkflows();
    } catch {
      pushToast('Unable to update workflow status', 'error');
    } finally {
      setPendingActionId(null);
    }
  };

  const deleteWorkflow = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      setPendingActionId(deleteTarget.id);
      await workflowAPI.delete(deleteTarget.id);
      pushToast('Workflow deleted', 'success');
      setDeleteTarget(null);
      await loadWorkflows();
    } catch {
      pushToast('Failed to delete workflow', 'error');
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Workflows</h1>
          <p className="text-sm text-slate-400">Manage webhook automations and AI processing flows.</p>
        </div>
        <Link href="/dashboard/workflows/new" className="btn-primary">
          Create Workflow
        </Link>
      </div>

      <div className="card-surface flex flex-wrap items-center gap-2 p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search workflows"
          className="min-w-52 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'all' | 'active' | 'disabled')}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {loading ? (
        <div className="card-surface flex h-52 items-center justify-center">
          <Spinner size={30} />
        </div>
      ) : filtered.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Workflow name</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Webhook Key</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, index) => {
                const pending = pendingActionId === row.id;
                return (
                  <tr key={row.id} className={`${index % 2 === 0 ? 'bg-slate-900/20' : ''} border-t border-slate-700`}>
                    <td className="px-4 py-3 text-slate-100">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${row.isActive ? 'bg-green-900/40 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                        {row.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {row.webhookKey ? `${row.webhookKey.slice(0, 16)}...` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => void toggleWorkflow(row)}
                          disabled={pending}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
                        >
                          {pending ? 'Saving...' : row.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(row)}
                          disabled={pending}
                          className="rounded-md border border-red-800/60 px-2 py-1 text-xs text-red-300 transition hover:bg-red-950/35 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-surface p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-50">No workflows found</h2>
          <p className="mt-2 text-sm text-slate-400">Create your first workflow to generate a webhook endpoint.</p>
        </div>
      )}

      {filtered.length ? (
        <div className="card-surface flex items-center justify-between p-3 text-sm text-slate-300">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="btn-secondary px-3 py-1.5"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Workflow"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}" and its execution history.`
            : 'This action cannot be undone.'
        }
        confirmLabel="Delete"
        loading={Boolean(deleteTarget && pendingActionId === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void deleteWorkflow()}
      />
    </div>
  );
}
