'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Search,
  Settings2,
  Slack,
  X,
} from 'lucide-react';

import { useToast } from '@/components/ui/toast';

type IntegrationCategory = 'All' | 'Social media' | 'Communication';

interface IntegrationProvider {
  id: string;
  name: string;
  company: string;
  description: string;
  category: Exclude<IntegrationCategory, 'All'>;
  icon: typeof Facebook;
  iconClassName: string;
  scopes: string[];
  developerUrl: string;
}

const providers: IntegrationProvider[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    company: 'Meta',
    description: 'Publish page content and use Facebook activity as a workflow trigger.',
    category: 'Social media',
    icon: Facebook,
    iconClassName: 'bg-blue-500/15 text-blue-300',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    developerUrl: 'https://developers.facebook.com/apps/',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    company: 'Meta',
    description: 'Connect a professional Instagram account to publish and monitor content.',
    category: 'Social media',
    icon: Instagram,
    iconClassName: 'bg-pink-500/15 text-pink-300',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    developerUrl: 'https://developers.facebook.com/apps/',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    company: 'LinkedIn',
    description: 'Create posts and automate organization or professional network updates.',
    category: 'Social media',
    icon: Linkedin,
    iconClassName: 'bg-sky-500/15 text-sky-300',
    scopes: ['openid', 'profile', 'w_member_social'],
    developerUrl: 'https://www.linkedin.com/developers/apps',
  },
  {
    id: 'x',
    name: 'X / Twitter',
    company: 'X Corp.',
    description: 'Publish posts and react to account activity from automated workflows.',
    category: 'Social media',
    icon: X,
    iconClassName: 'bg-slate-500/20 text-slate-100',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    developerUrl: 'https://developer.x.com/en/portal/dashboard',
  },
  {
    id: 'slack',
    name: 'Slack',
    company: 'Salesforce',
    description: 'Send channel messages and trigger workflows from team activity.',
    category: 'Communication',
    icon: Slack,
    iconClassName: 'bg-violet-500/15 text-violet-300',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    developerUrl: 'https://api.slack.com/apps',
  },
  {
    id: 'discord',
    name: 'Discord',
    company: 'Discord',
    description: 'Send messages to servers and automate community notifications.',
    category: 'Communication',
    icon: MessageCircle,
    iconClassName: 'bg-indigo-500/15 text-indigo-300',
    scopes: ['identify', 'guilds', 'webhook.incoming'],
    developerUrl: 'https://discord.com/developers/applications',
  },
];

const categories: IntegrationCategory[] = ['All', 'Social media', 'Communication'];

export default function IntegrationsPage() {
  const { pushToast } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<IntegrationCategory>('All');
  const [selected, setSelected] = useState<IntegrationProvider | null>(null);

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesCategory = category === 'All' || provider.category === category;
      const matchesQuery =
        !normalizedQuery ||
        provider.name.toLowerCase().includes(normalizedQuery) ||
        provider.description.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const callbackUrl = selected
    ? `${typeof window === 'undefined' ? 'http://localhost:4000' : window.location.origin.replace(':3000', ':4000')}/api/integrations/${selected.id}/callback`
    : '';

  const copyCallback = async () => {
    await navigator.clipboard.writeText(callbackUrl);
    pushToast('Callback URL copied', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300">
            <Settings2 size={13} /> Integration catalog
          </div>
          <h1 className="text-2xl font-semibold text-slate-50">Integrations</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Connect social and communication services to use them as workflow triggers and actions.
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          OAuth server configuration is required before connecting an account.
        </div>
      </div>

      <section className="card-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  category === item
                    ? 'bg-primary-500 text-white'
                    : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="flex min-w-64 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search integrations"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>
        </div>
      </section>

      {filteredProviders.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProviders.map((provider) => {
            const Icon = provider.icon;
            return (
              <article key={provider.id} className="card-surface flex min-h-64 flex-col p-5 transition hover:border-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${provider.iconClassName}`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400">Not connected</span>
                </div>
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-slate-50">{provider.name}</h2>
                  <p className="text-xs text-slate-500">by {provider.company}</p>
                  <p className="mt-3 text-sm text-slate-400">{provider.description}</p>
                </div>
                <div className="mt-auto pt-5">
                  <button onClick={() => setSelected(provider)} className="btn-secondary flex w-full items-center justify-center gap-2">
                    View setup <ChevronRight size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card-surface p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-100">No integrations found</h2>
          <p className="mt-2 text-sm text-slate-400">Try another search term or category.</p>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onMouseDown={() => setSelected(null)}>
          <section
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-700 p-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-50">Set up {selected.name}</h2>
                <p className="mt-1 text-sm text-slate-400">Complete the provider and backend configuration before OAuth connection.</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <ol className="space-y-3">
                {[
                  'Create an application in the provider developer console.',
                  'Add the callback URL below to the provider OAuth settings.',
                  'Store the client ID and client secret in the backend environment—not in the browser.',
                  'Enable the OAuth backend route, then return here to connect your account.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-xs font-semibold text-primary-300">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">OAuth callback URL</label>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 p-2">
                  <code className="min-w-0 flex-1 overflow-x-auto px-1 text-xs text-primary-300">{callbackUrl}</code>
                  <button onClick={() => void copyCallback()} className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title="Copy callback URL">
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Requested permissions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.scopes.map((scope) => (
                    <span key={scope} className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      <Check size={11} className="text-emerald-400" /> {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700 pt-5">
                <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
                <a href={selected.developerUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
                  Open developer console <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}