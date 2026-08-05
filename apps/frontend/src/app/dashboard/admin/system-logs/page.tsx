'use client';

import { useEffect, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { adminAPI } from '@/lib/api';

interface SystemLogRow {
  id: string;
  level: string;
  event: string;
  message: string;
  createdAt: string;
}

export default function SystemLogsPage() {
  const { pushToast } = useToast();
  const [rows, setRows] = useState<SystemLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getSystemLogs({ page: 1, limit: 60 });
        setRows(response.data.data.items || []);
      } catch {
        pushToast('Failed to load system logs', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [pushToast]);

  if (loading) {
    return (
      <div className="card-surface flex h-44 items-center justify-center">
        <Spinner size={30} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-50">System Logs</h1>
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm">
        {rows.length ? (
          rows.map((log) => (
            <div key={log.id} className="border-b border-slate-700 py-2 last:border-b-0">
              <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
              <span className="ml-3 text-slate-300">{log.level}</span>
              <span className="ml-3 text-primary-300">{log.event}</span>
              <span className="ml-3 text-slate-100">{log.message}</span>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No logs recorded yet.</p>
        )}
      </div>
    </div>
  );
}
