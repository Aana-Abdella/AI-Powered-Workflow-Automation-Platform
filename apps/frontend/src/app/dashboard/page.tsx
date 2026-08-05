'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { adminAPI, executionsAPI, workflowAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface DashboardData {
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  failedJobs: number;
  recent: Array<{ id: string; workflowName: string; status: string; createdAt: string }>;
}

interface AdminDashboardData {
  totalUsers: number;
  totalExecutions: number;
  activeWorkflows: number;
  failedJobs: number;
  simulatedRevenue: number;
  healthStatus: string;
  databaseStatus?: string;
  redisStatus?: string;
}

export default function DashboardPage() {
  const { pushToast } = useToast();
  const organization = useAuthStore((state) => state.organization);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0,
    failedJobs: 0,
    recent: [],
  });
  const [adminData, setAdminData] = useState<AdminDashboardData>({
    totalUsers: 0,
    totalExecutions: 0,
    activeWorkflows: 0,
    failedJobs: 0,
    simulatedRevenue: 0,
    healthStatus: 'unknown',
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        setLoading(true);

        if (isAdmin) {
          const [metricsRes, healthRes] = await Promise.all([adminAPI.getMetrics(), adminAPI.getSystemHealth()]);
          const metrics = metricsRes.data.data || {};
          const health = healthRes.data.data || {};

          setAdminData({
            totalUsers: metrics.totalUsers ?? metrics.users ?? 0,
            totalExecutions: metrics.totalExecutions ?? metrics.executions?.total ?? 0,
            activeWorkflows: metrics.activeWorkflows ?? metrics.workflows ?? 0,
            failedJobs: metrics.failedJobs ?? metrics.executions?.failed ?? 0,
            simulatedRevenue: metrics.simulatedRevenue ?? metrics.revenue ?? 0,
            healthStatus: health.status || health.database?.status || 'unknown',
            databaseStatus: health.database?.status || health.database,
            redisStatus: health.redis || 'unknown',
          });
        } else {
          if (!organization?.id) {
            setLoading(false);
            return;
          }

          const orgId = organization.id;

          const [workflowRes, statsRes, logsRes] = await Promise.all([
            workflowAPI.list(orgId),
            executionsAPI.getStats(orgId),
            executionsAPI.list(orgId, { limit: 5, offset: 0 }),
          ]);

          const workflows = (workflowRes.data.data || []) as Array<{ isActive?: boolean; isEnabled?: boolean }>;
          const stats = statsRes.data.data || {};
          const rawLogs = logsRes.data.data;
          const logs = (Array.isArray(rawLogs) ? rawLogs : rawLogs.items || []) as Array<{
            id: string;
            workflowName: string;
            workflow?: { name?: string };
            status: string;
            createdAt: string;
            startedAt?: string;
          }>;

          setData({
            activeWorkflows: workflows.filter((item) => item.isActive ?? item.isEnabled).length,
            totalExecutions: stats.totalExecutions ?? stats.totals?.executions ?? 0,
            successRate: stats.successRate ?? stats.rates?.successRate ?? 0,
            failedJobs: stats.failedCount ?? stats.totals?.failed ?? 0,
            recent: logs.map((item) => ({
              id: item.id,
              workflowName: item.workflowName || item.workflow?.name || 'Workflow',
              status: item.status,
              createdAt: item.createdAt || item.startedAt || new Date().toISOString(),
            })),
          });
        }
      } catch {
        pushToast(isAdmin ? 'Failed to load admin metrics' : 'Failed to load dashboard metrics', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
    if (isAdmin) {
      interval = setInterval(() => {
        void load();
      }, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAdmin, organization?.id, pushToast]);

  const kpis = useMemo(
    () => [
      { label: 'Active workflows', value: data.activeWorkflows.toString() },
      { label: 'Total executions', value: data.totalExecutions.toLocaleString() },
      { label: 'Success rate', value: `${data.successRate}%` },
      { label: 'Failed jobs', value: data.failedJobs.toString() },
    ],
    [data]
  );

  const adminKpis = useMemo(
    () => [
      { label: 'Total users', value: adminData.totalUsers.toLocaleString() },
      { label: 'Total executions', value: adminData.totalExecutions.toLocaleString() },
      { label: 'Active workflows', value: adminData.activeWorkflows.toLocaleString() },
      { label: 'Failed jobs', value: adminData.failedJobs.toLocaleString() },
      { label: 'Simulated revenue', value: `$${adminData.simulatedRevenue.toFixed(2)}` },
      { label: 'System health', value: adminData.healthStatus },
    ],
    [adminData]
  );

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">System-wide visibility for platform operations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/user-management" className="btn-secondary">
              User Management
            </Link>
            <Link href="/dashboard/admin/system-logs" className="btn-secondary">
              System Logs
            </Link>
            <Link href="/dashboard/admin/platform-metrics" className="btn-primary">
              Platform Metrics
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="card-surface flex h-56 items-center justify-center">
            <Spinner size={30} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminKpis.map((item) => (
              <div key={item.label} className="card-surface p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-400">Operational overview for your tenant.</p>
        </div>
        <Link href="/dashboard/workflows/new" className="btn-primary">
          Create Workflow
        </Link>
      </div>

      {loading ? (
        <div className="card-surface flex h-56 items-center justify-center">
          <Spinner size={30} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="card-surface p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{item.value}</p>
              </div>
            ))}
          </div>

          <section className="card-surface p-5">
            <h2 className="text-sm font-semibold text-slate-100">Recent logs</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Workflow</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.length ? (
                    data.recent.map((row, index) => (
                      <tr key={row.id} className={index % 2 === 0 ? 'bg-slate-900/25' : ''}>
                        <td className="px-3 py-2 font-mono text-xs text-slate-300">{row.id.slice(0, 10)}</td>
                        <td className="px-3 py-2 text-slate-200">{row.workflowName}</td>
                        <td className="px-3 py-2">
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
                        <td className="px-3 py-2 text-slate-400">{new Date(row.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-4 text-slate-400" colSpan={4}>
                        No executions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
