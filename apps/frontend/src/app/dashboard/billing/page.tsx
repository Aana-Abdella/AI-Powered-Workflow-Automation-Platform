'use client';

import { useEffect, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { analyticsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface BillingData {
  plan: string;
  usedExecutions: number;
  freeLimit: number;
  successfulExecutions: number;
  failedExecutions: number;
  usagePercent: number;
  estimatedBill: number;
}

export default function BillingPage() {
  const { pushToast } = useToast();
  const organization = useAuthStore((state) => state.organization);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingData | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await analyticsAPI.getBilling(organization.id);
        const raw = response.data.data || {};
        const normalized: BillingData = {
          plan: raw.plan || raw.currentPlan?.toUpperCase() || 'FREE',
          usedExecutions: raw.usedExecutions ?? raw.usage?.workflowRuns ?? 0,
          freeLimit: raw.freeLimit ?? raw.limits?.workflowRuns ?? 100,
          successfulExecutions: raw.successfulExecutions ?? 0,
          failedExecutions: raw.failedExecutions ?? 0,
          usagePercent:
            raw.usagePercent ??
            (raw.limits?.workflowRuns
              ? Math.min(100, ((raw.usage?.workflowRuns || 0) / raw.limits.workflowRuns) * 100)
              : 0),
          estimatedBill: raw.estimatedBill ?? 0,
        };
        setData(normalized);
      } catch {
        pushToast('Failed to load billing data', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [organization?.id, pushToast]);

  if (loading) {
    return (
      <div className="card-surface flex h-56 items-center justify-center">
        <Spinner size={30} />
      </div>
    );
  }

  if (!data) {
    return <div className="card-surface p-5 text-sm text-slate-300">Billing data unavailable.</div>;
  }

  const limitLabel = data.plan === 'PRO' ? 'Unlimited' : data.freeLimit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Billing Simulation</h1>
        <p className="text-sm text-slate-400">Track execution usage and simulated plan overage.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="card-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-100">Current Plan</h2>
          <p className="mt-3 text-xl font-semibold text-slate-50">{data.plan === 'PRO' ? 'Pro (Simulated)' : 'Free'}</p>
          <p className="mt-1 text-sm text-slate-400">
            {data.plan === 'PRO'
              ? 'Unlimited executions with usage monitoring.'
              : `${data.freeLimit} executions included.`}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full bg-primary-500" style={{ width: `${Math.min(data.usagePercent, 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {data.usedExecutions} / {limitLabel} executions used
          </p>
        </section>

        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold text-slate-100">Estimated Bill</h2>
          <p className="mt-3 text-2xl font-semibold text-slate-50">${data.estimatedBill.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-400">Simulated only. No payment gateway connected.</p>
        </section>
      </div>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">Execution Summary</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li className="flex justify-between rounded border border-slate-700 bg-slate-900 px-3 py-2">
            <span>Total Executions</span>
            <span>{data.usedExecutions}</span>
          </li>
          <li className="flex justify-between rounded border border-slate-700 bg-slate-900 px-3 py-2">
            <span>Successful</span>
            <span>{data.successfulExecutions}</span>
          </li>
          <li className="flex justify-between rounded border border-slate-700 bg-slate-900 px-3 py-2">
            <span>Failed</span>
            <span>{data.failedExecutions}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
