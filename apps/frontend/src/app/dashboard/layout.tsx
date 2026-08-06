'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Workflows', href: '/dashboard/workflows' },
  { label: 'Integrations', href: '/dashboard/integrations' },
  { label: 'Logs', href: '/dashboard/executions' },
  { label: 'API Keys', href: '/dashboard/api-keys' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Billing', href: '/dashboard/billing' },
  { label: 'Documentation', href: '/dashboard/documentation' },
  { label: 'Settings', href: '/dashboard/settings' },
  { label: 'System Logs', href: '/dashboard/admin/system-logs', adminOnly: true },
  { label: 'User Management', href: '/dashboard/admin/user-management', adminOnly: true },
  { label: 'Platform Metrics', href: '/dashboard/admin/platform-metrics', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pushToast } = useToast();
  const { user, organization, isAuthenticated, hydrated, clearAuth } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/401');
    }
  }, [hydrated, isAuthenticated, router]);

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user?.role]);
  const nav = primaryNav.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authAPI.logout();
      clearAuth();
      pushToast('Logged out successfully', 'success');
      router.push('/login');
    } catch {
      clearAuth();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
        <div className="text-center">
          <Spinner size={34} />
          <p className="mt-4 text-sm text-slate-400">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
        <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 text-center shadow-card">
          <h1 className="text-xl font-semibold">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to view your integrations and connect accounts.</p>
          <button onClick={() => router.push('/login')} className="btn-primary mt-6">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 z-50 border-r border-slate-700 bg-slate-900 transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        } ${sidebarOpen ? 'left-0' : '-left-64'} lg:left-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
          <span className={`font-semibold text-primary-400 ${collapsed ? 'hidden' : 'block'}`}>FlowForge</span>
          <button
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="space-y-1 p-2">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm transition duration-150 ${
                  active ? 'bg-primary-600/20 text-primary-300' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded p-1 text-slate-400 hover:bg-slate-800 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>

              <button className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200">
                <span>{organization?.name || 'Organization'}</span>
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="hidden w-full max-w-xl items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 md:flex">
              <Search size={16} className="text-slate-500" />
              <input
                placeholder="Search workflows, logs, users"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-md border border-slate-700 p-2 text-slate-300 hover:bg-slate-800">
                <Bell size={16} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md border border-slate-700 px-2 py-1.5 hover:bg-slate-800"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600/20 text-xs font-semibold text-primary-300">
                    {(user?.firstName?.[0] || 'U').toUpperCase()}
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border border-slate-700 bg-slate-900 p-1">
                    <Link href="/dashboard/settings" className="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                      Settings
                    </Link>
                    <Link href="/dashboard/billing" className="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                      Billing
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-60"
                    >
                      <LogOut size={14} />
                      {loggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
