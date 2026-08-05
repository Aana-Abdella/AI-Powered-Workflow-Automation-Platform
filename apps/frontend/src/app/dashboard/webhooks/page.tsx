'use client';

import { useState } from 'react';

interface WebhookRow {
  id: string;
  workflow: string;
  endpoint: string;
  status: 'active' | 'disabled';
  events24h: number;
}

const data: WebhookRow[] = [
  {
    id: 'wh_01',
    workflow: 'Lead Qualification',
    endpoint: 'https://api.flowforge.app/v1/webhooks/wh_01',
    status: 'active',
    events24h: 143,
  },
  {
    id: 'wh_02',
    workflow: 'Invoice Processing',
    endpoint: 'https://api.flowforge.app/v1/webhooks/wh_02',
    status: 'disabled',
    events24h: 0,
  },
];

export default function WebhooksPage() {
  const [view, setView] = useState<'data' | 'loading' | 'empty' | 'error'>('data');

  if (view === 'loading') {
    return <div className="h-72 animate-pulse rounded-xl border border-dark-800 bg-dark-900" />;
  }

  if (view === 'error') {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-6">
        <h1 className="text-lg font-semibold text-red-300">Webhook service degraded</h1>
        <p className="mt-2 text-sm text-red-200">Incoming events could not be listed.</p>
      </div>
    );
  }

  const rows = view === 'empty' ? [] : data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-dark-50">Webhooks</h1>
          <p className="text-sm text-dark-400">Manage endpoint URLs, secrets, event history, and test calls.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-dark-700 px-3 py-2 text-sm text-dark-200 hover:bg-dark-800">
            Test endpoint
          </button>
          <button className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-500">
            Generate webhook
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dark-800 bg-dark-900 p-8 text-center">
          <h2 className="text-lg font-semibold text-dark-50">No webhook endpoints</h2>
          <p className="mt-2 text-sm text-dark-400">Create a webhook-triggered workflow to start receiving events.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-dark-800 bg-dark-900">
          <table className="w-full text-sm">
            <thead className="bg-dark-900/80 text-dark-400">
              <tr>
                <th className="px-4 py-3 text-left">Workflow</th>
                <th className="px-4 py-3 text-left">Endpoint</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">24h events</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-dark-800">
                  <td className="px-4 py-3 text-dark-100">{row.workflow}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-dark-950 px-2 py-1 text-xs text-primary-300">{row.endpoint}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === 'active' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-dark-800 text-dark-400'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark-300">{row.events24h}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded border border-dark-700 px-2 py-1 text-xs text-dark-300 hover:bg-dark-800">Copy</button>
                    <button className="ml-2 rounded border border-dark-700 px-2 py-1 text-xs text-dark-300 hover:bg-dark-800">
                      Regenerate secret
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-dark-800 bg-dark-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-dark-100">State Preview</h2>
          <div className="flex gap-2">
            {(['data', 'loading', 'empty', 'error'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className="rounded-md border border-dark-700 px-2 py-1 text-xs text-dark-300 hover:bg-dark-800"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
