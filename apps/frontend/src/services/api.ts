import axios, { AxiosError, AxiosInstance } from 'axios'; // Updated path: src/services/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API methods
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh'),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  deleteAccount: () => api.delete('/auth/delete-account'),
};

export const workflowAPI = {
  create: (data: any, organizationId?: string) =>
    api.post('/workflows', {
      ...data,
      organizationId: data.organizationId || organizationId,
      trigger: data.trigger || {
        type: 'webhook',
        config: {},
      },
      actions:
        data.actions ||
        [
          {
            type: 'ai',
            config: { operation: 'summarize' },
          },
        ],
    }),

  list: (organizationId: string) =>
    api.get('/workflows', { params: { organizationId } }),

  getById: (id: string) => api.get(`/workflows/${id}`),

  update: (id: string, data: any) => api.patch(`/workflows/${id}`, data),

  delete: (id: string) => api.delete(`/workflows/${id}`),

  enable: (id: string) => api.post(`/workflows/${id}/enable`),

  disable: (id: string) => api.post(`/workflows/${id}/disable`),

  getExecutions: (id: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/workflows/${id}/executions`, { params }),

  triggerWebhook: (token: string, data: any) =>
    api.post(`/workflows/webhook/${token}`, data),
};

export const organizationAPI = {
  list: () => api.get('/organizations'),

  getById: (id: string) => api.get(`/organizations/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post('/organizations', data),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/organizations/${id}`, data),

  addMember: (id: string, data: { email: string; role?: 'ADMIN' | 'MEMBER' }) =>
    api.post(`/organizations/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    api.delete(`/organizations/${id}/members/${userId}`),

  updateMemberRole: (id: string, userId: string, data: { role: 'ADMIN' | 'MEMBER' }) =>
    api.patch(`/organizations/${id}/members/${userId}`, data),

  leave: (id: string) => api.post(`/organizations/${id}/leave`),
};

export const analyticsAPI = {
  getUsage: (organizationId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/usage', { params: { organizationId, ...params } }),

  getExecutions: (organizationId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/executions', { params: { organizationId, ...params } }),

  getBilling: (organizationId: string) =>
    api.get('/analytics/billing', { params: { organizationId } }),

  getPlans: () => api.get('/analytics/plans'),
};

export const adminAPI = {
  getUsers: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),

  getUserById: (userId: string) => api.get(`/admin/users/${userId}`),

  updateUser: (userId: string, data: { isActive?: boolean; emailVerified?: boolean }) =>
    api.patch(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  getOrganizations: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/organizations', { params }),

  getSystemLogs: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/admin/logs', { params }),

  getSystemHealth: () => api.get('/admin/health'),

  getMetrics: () => api.get('/admin/metrics'),
};

export const apiKeysAPI = {
  create: (organizationId: string, data: { name: string; expiresIn?: number; rateLimit?: number }) =>
    api.post('/api-keys', data, { params: { organizationId } }),

  list: (organizationId: string) =>
    api.get('/api-keys', { params: { organizationId } }),

  getById: (organizationId: string, id: string) =>
    api.get(`/api-keys/${id}`, { params: { organizationId } }),

  revoke: (organizationId: string, id: string) =>
    api.post(`/api-keys/${id}/revoke`, {}, { params: { organizationId } }),

  regenerate: (organizationId: string, id: string) =>
    api.post(`/api-keys/${id}/regenerate`, {}, { params: { organizationId } }),

  delete: (organizationId: string, id: string) =>
    api.delete(`/api-keys/${id}`, { params: { organizationId } }),
};

export const executionsAPI = {
  list: (organizationId: string, params?: { workflowId?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('/executions', { params: { organizationId, ...params } }),

  getById: (organizationId: string, id: string) =>
    api.get(`/executions/${id}`, { params: { organizationId } }),

  getStats: (organizationId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get('/executions/stats', { params: { organizationId, ...params } }),

  cancel: (organizationId: string, id: string) =>
    api.post(`/executions/${id}/cancel`, {}, { params: { organizationId } }),

  retry: (organizationId: string, id: string) =>
    api.post(`/executions/${id}/retry`, {}, { params: { organizationId } }),
};

export const teamAPI = {
  getMembers: (organizationId: string) =>
    api.get('/team/members', { params: { organizationId } }),

  inviteMember: (organizationId: string, data: { email: string; role?: 'ADMIN' | 'MEMBER' }) =>
    api.post('/team/members', data, { params: { organizationId } }),

  updateMemberRole: (organizationId: string, userId: string, data: { role: 'ADMIN' | 'MEMBER' }) =>
    api.patch(`/team/members/${userId}`, data, { params: { organizationId } }),

  removeMember: (organizationId: string, userId: string) =>
    api.delete(`/team/members/${userId}`, { params: { organizationId } }),

  leaveOrganization: (organizationId: string) =>
    api.post('/team/leave', {}, { params: { organizationId } }),
};
