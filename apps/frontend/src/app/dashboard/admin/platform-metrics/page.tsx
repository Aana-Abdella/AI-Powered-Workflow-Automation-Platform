'use client';

import { useEffect, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { adminAPI } from '@/lib/api';

interface Metrics {
  totalUsers: number;
  totalExecutions: number;
  activeWorkflows: number;
  failedJobs: number;
  simulatedRevenue: number;
}

export default function PlatformMetricsPage() {
  const { pushToast } = useToast();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<{ status: string; database: string; redis: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        setLoading(true);
        const [metricsRes, healthRes] = await Promise.all([adminAPI.getMetrics(), adminAPI.getSystemHealth()]);
        setMetrics(metricsRes.data.data);
        setHealth(healthRes.data.data);
      } catch {
        pushToast('Failed to load platform metrics', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
    interval = setInterval(() => {
      void load();
    }, 15000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pushToast]);

  if (loading) {
    return (
      <div className="card-surface flex h-48 items-center justify-center">
        <Spinner size={30} />
      </div>
    );
  }

  if (!metrics || !health) {
    return <div className="card-surface p-5 text-sm text-slate-300">Metrics unavailable.</div>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-50">Platform Metrics</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card label="Total users" value={metrics.totalUsers.toString()} />
        <Card label="Total executions" value={metrics.totalExecutions.toString()} />
        <Card label="Active workflows" value={metrics.activeWorkflows.toString()} />
        <Card label="Failed jobs" value={metrics.failedJobs.toString()} />
        <Card label="Simulated revenue" value={`$${metrics.simulatedRevenue.toFixed(2)}`} />
        <Card label="System health" value={health.status} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
