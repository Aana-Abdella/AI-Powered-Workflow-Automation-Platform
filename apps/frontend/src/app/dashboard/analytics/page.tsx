'use client';

import { useEffect, useMemo, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { analyticsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Point {
  label: string;
  executions: number;
  success: number;
  failed: number;
}

function normalizeAnalytics(raw: any): Point[] {
  if (Array.isArray(raw?.points)) {
    return raw.points;
  }
  if (Array.isArray(raw?.byWorkflow)) {
    return raw.byWorkflow.map((item: any) => ({
      label: item.name || 'Workflow',
      executions: item.total || 0,
      success: item.success || 0,
      failed: item.failed || 0,
    }));
  }
  if (raw?.totals) {
    return [
      {
        label: 'Total',
        executions: raw.totals.executions || 0,
        success: raw.totals.success || 0,
        failed: raw.totals.failed || 0,
      },
    ];
  }
  return [];
}

export default function AnalyticsPage() {
  const organization = useAuthStore((state) => state.organization);
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await analyticsAPI.getExecutions(organization.id);
        setPoints(normalizeAnalytics(response.data.data));
      } catch {
        pushToast('Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [organization?.id, pushToast]);

  const totals = useMemo(() => {
    const executions = points.reduce((sum, point) => sum + point.executions, 0);
    const success = points.reduce((sum, point) => sum + point.success, 0);
    const failed = points.reduce((sum, point) => sum + point.failed, 0);
    return { executions, success, failed };
  }, [points]);

  if (loading) {
    return (
      <div className="card-surface flex h-56 items-center justify-center">
        <Spinner size={30} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Analytics</h1>
        <p className="text-sm text-slate-400">Workflow executions over time, success ratio, and usage trend.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Executions" value={totals.executions.toString()} />
        <Metric label="Success" value={totals.success.toString()} />
        <Metric label="Failed" value={totals.failed.toString()} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold text-slate-100">Workflow Executions Over Time</h2>
          <BarChart data={points.map((item) => item.executions)} labels={points.map((item) => item.label.slice(5))} color="bg-primary-500" />
        </section>

        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold text-slate-100">Success vs Failure Ratio</h2>
          <BarChart
            data={[totals.success, totals.failed]}
            labels={['Success', 'Failed']}
            color="bg-green-500"
            secondaryColor="bg-red-500"
          />
        </section>
      </div>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold text-slate-100">Usage Trend</h2>
        <LineChart data={points.map((item) => item.executions)} />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function BarChart({
  data,
  labels,
  color,
  secondaryColor,
}: {
  data: number[];
  labels: string[];
  color: string;
  secondaryColor?: string;
}) {
  if (!data.length) {
    return <p className="mt-4 text-sm text-slate-400">No chart data available yet.</p>;
  }

  const max = Math.max(...data, 1);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex h-48 items-end gap-2">
        {data.map((value, index) => (
          <div key={`${labels[index]}-${value}-${index}`} className="flex flex-1 flex-col items-center">
            <div
              className={`w-full rounded-t ${secondaryColor && index === 1 ? secondaryColor : color}`}
              style={{ height: `${Math.max((value / max) * 100, 6)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 text-xs text-slate-400">
        {labels.map((label) => (
          <span key={label} className="flex-1 text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: number[] }) {
  if (!data.length) {
    return <p className="mt-4 text-sm text-slate-400">No trend data available yet.</p>;
  }

  const width = 600;
  const height = 180;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const path = data
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 20) - 10;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full min-w-[600px]">
        <path d={path} fill="none" stroke="#6366F1" strokeWidth="3" />
      </svg>
    </div>
  );
}
