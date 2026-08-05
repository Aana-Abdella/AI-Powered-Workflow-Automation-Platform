'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { executionsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ExecutionDetail {
  id: string;
  workflowName: string;
  status: string;
  inputText: string;
  outputText?: string;
  errorMessage?: string;
  createdAt: string;
}

export default function ExecutionDetailsPage() {
  const params = useParams<{ id: string }>();
  const organization = useAuthStore((state) => state.organization);
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await executionsAPI.getById(organization?.id || '', params.id);
        setDetail(response.data.data);
      } catch {
        pushToast('Failed to load execution details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void load();
    }
  }, [organization?.id, params.id, pushToast]);

  if (loading) {
    return (
      <div className="card-surface flex h-56 items-center justify-center">
        <Spinner size={30} />
      </div>
    );
  }

  if (!detail) {
    return <div className="card-surface p-5 text-sm text-slate-300">Execution not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Execution Details</h1>
        <p className="text-sm text-slate-400">
          {detail.id} • {detail.workflowName} • {new Date(detail.createdAt).toLocaleString()}
        </p>
      </div>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">Status</h2>
        <p className="mt-2 text-sm text-slate-300">{detail.status}</p>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">Input Text</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-primary-300">{detail.inputText}</pre>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">Output Summary</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-green-300">{detail.outputText || 'Pending output...'}</pre>
      </section>

      {detail.errorMessage ? (
        <section className="rounded-xl border border-red-900/40 bg-red-950/20 p-5">
          <h2 className="text-sm font-semibold text-red-300">Error</h2>
          <p className="mt-2 text-sm text-red-200">{detail.errorMessage}</p>
        </section>
      ) : null}
    </div>
  );
}
