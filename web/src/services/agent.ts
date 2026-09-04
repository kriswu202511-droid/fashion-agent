import type { Agent, Task, User, PaginatedResponse, CollaborationEvent, TenantSettings } from '@/types';
import api from './api';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      username,
      password,
    }),
  register: (data: { username: string; email: string; password: string; display_name?: string; store_name?: string }) =>
    api.post<User>('/auth/register', data),
};

export const settingsApi = {
  get: () => api.get<TenantSettings>('/settings/settings'),
  update: (data: Partial<TenantSettings>) => api.put<TenantSettings>('/settings/settings', data),
  getProfile: () => api.get<{ user: User; settings: TenantSettings }>('/settings/profile'),
  updateProfile: (data: { display_name?: string; email?: string }) =>
    api.put<User>('/settings/profile', data),
};

export const agentApi = {
  list: () => api.get<Agent[]>('/agents/'),
  get: (name: string) => api.get<Agent>(`/agents/${name}`),
  run: (agentName: string, inputData: Record<string, unknown> = {}) =>
    api.post<{ task_id: string; agent_name: string; status: string; output_data?: Record<string, unknown> }>('/agents/run', {
      agent_name: agentName,
      input_data: inputData,
    }),
};

export const taskApi = {
  list: (params?: { page?: number; page_size?: number; agent_name?: string }) =>
    api.get<PaginatedResponse<Task>>('/tasks/', { params }),
  get: (taskId: string) => api.get<Task>(`/tasks/${taskId}`),
};

export const workbenchApi = {
  overview: () =>
    api.get<{
      total_agents: number;
      agents: Agent[];
      collaboration_history: CollaborationEvent[];
    }>('/workbench/overview'),
};

export interface AdminStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  total_tasks: number;
  tasks_today: number;
  tasks_by_agent: Record<string, number>;
  tasks_by_status: Record<string, number>;
  total_revenue: number;
  revenue_today: number;
  subscriptions_by_plan: Record<string, number>;
  system_health: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  plan: string;
  created_at: string;
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),
  users: (page = 1, pageSize = 20) =>
    api.get<{ items: AdminUser[]; total: number }>('/admin/users', {
      params: { page, page_size: pageSize },
    }),
  toggleActive: (userId: string) =>
    api.put<{ id: string; is_active: boolean }>(`/admin/users/${userId}/toggle-active`),
};
