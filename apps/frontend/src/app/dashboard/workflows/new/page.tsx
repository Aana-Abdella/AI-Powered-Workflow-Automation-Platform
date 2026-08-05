'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/toast';
import { workflowAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function NewWorkflowPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const organization = useAuthStore((state) => state.organization);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      pushToast('Workflow name is required', 'error');
      return;
    }
    if (!organization?.id) {
      pushToast('Organization context is missing. Please sign in again.', 'error');
      return;
    }

    try {
      setLoading(true);
      await workflowAPI.create({ name: name.trim() }, organization.id);
      pushToast('Workflow created', 'success');
      router.push('/dashboard/workflows');
    } catch {
      pushToast('Failed to create workflow', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Create Workflow</h1>
        <p className="text-sm text-slate-400">Generate a unique webhook endpoint and enable AI summarization processing.</p>
      </div>

      <form onSubmit={handleCreate} className="card-surface max-w-xl space-y-4 p-5">
        <div>
          <label htmlFor="workflow-name" className="block text-sm font-medium text-slate-300">
            Workflow Name
          </label>
          <input
            id="workflow-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Support Ticket Summarizer"
            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-primary-500"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Workflow'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard/workflows')} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
