'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { executionsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ExecutionRow {
  id: string;
  workflowName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING';
  createdAt: string;
  inputText?: string;
}

const PAGE_SIZE = 10;

function normalizeExecution(raw: any): ExecutionRow {
  return {
    id: raw.id,
    workflowName: raw.workflowName || raw.workflow?.name || 'Workflow',
    status: (raw.status || 'PENDING') as ExecutionRow['status'],
    createdAt: raw.createdAt || raw.startedAt || raw.created_at || new Date().toISOString(),
    inputText: raw.inputText || raw.input,
  };
}

export default function ExecutionsPage() {
  const { pushToast } = useToast();
  const organization = useAuthStore((state) => state.organization);

  const [rows, setRows] = useState<ExecutionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING'>('ALL');
  const [page, setPage] = useState(1);

  const fetchExecutions = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await executionsAPI.list(organization.id, {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      const data = response.data.data;
      if (Array.isArray(data)) {
        setRows(data.map(normalizeExecution));
        setTotal(response.data.pagination?.total || data.length || 0);
      } else {
        setRows((data.items || []).map(normalizeExecution));
        setTotal(data.total || 0);
      }
    } catch {
      pushToast('Failed to load executions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchExecutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, page]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchExecutions();
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, page]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = status === 'ALL' || row.status === status;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || row.workflowName.toLowerCase().includes(q) || row.id.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, rows, status]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Execution Logs</h1>
        <p className="text-sm text-slate-400">Polling every 5 seconds for real-time status updates.</p>
      </div>

      <div className="card-surface flex flex-wrap gap-2 p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by execution ID or workflow"
          className="min-w-52 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING')}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option>ALL</option>
          <option>SUCCESS</option>
          <option>FAILED</option>
          <option>PENDING</option>
          <option>PROCESSING</option>
        </select>
      </div>

      {loading ? (
        <div className="card-surface flex h-56 items-center justify-center">
          <Spinner size={30} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Execution ID</th>
                <th className="px-4 py-3 text-left">Workflow</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((row, index) => (
                  <tr key={row.id} className={`${index % 2 === 0 ? 'bg-slate-900/20' : ''} border-t border-slate-700`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-100">{row.id}</td>
                    <td className="px-4 py-3 text-slate-300">{row.workflowName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          row.status === 'SUCCESS'
                            ? 'bg-green-900/40 text-green-300'
                            : row.status === 'FAILED'
                              ? 'bg-red-900/40 text-red-300'
                              : 'bg-amber-900/40 text-amber-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/executions/${row.id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>
                    No logs found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}
