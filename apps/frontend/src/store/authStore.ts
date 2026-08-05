import { create } from 'zustand';

import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;

  setAuth: (user: User, organization: Organization, accessToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  hydrateAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  accessToken: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, organization, accessToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
    }
    set({
      user,
      organization,
      accessToken,
      isAuthenticated: true,
      hydrated: true,
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    set({
      user: null,
      organization: null,
      accessToken: null,
      isAuthenticated: false,
      hydrated: true,
    });
  },

  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  hydrateAuth: async () => {
    if (typeof window === 'undefined') {
      set({ hydrated: true });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ hydrated: true, isAuthenticated: false, accessToken: null, user: null, organization: null });
      return;
    }

    try {
      const response = await authAPI.me();
      const payload = response.data.data || {};

      // Support both new API shape ({ user, organization }) and legacy shape.
      const user = payload.user || {
        id: payload.userId || payload.id || '',
        email: payload.email || '',
        firstName: payload.firstName || 'User',
        lastName: payload.lastName || '',
        role: payload.role,
      };
      const organization =
        payload.organization ||
        (payload.organizationId
          ? {
              id: payload.organizationId,
              name: payload.organizationName || 'Organization',
              slug: payload.organizationSlug || 'organization',
            }
          : null);

      if (!user.id || !organization?.id) {
        throw new Error('Invalid auth payload');
      }

      set({
        user,
        organization,
        accessToken: token,
        isAuthenticated: true,
        hydrated: true,
      });
    } catch {
      localStorage.removeItem('accessToken');
      set({
        user: null,
        organization: null,
        accessToken: null,
        isAuthenticated: false,
        hydrated: true,
      });
    }
  },
}));
