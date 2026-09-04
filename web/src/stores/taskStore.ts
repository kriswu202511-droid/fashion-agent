import { create } from 'zustand';
import type { Task } from '@/types';
import { taskApi } from '@/services/agent';

interface TaskState {
  tasks: Task[];
  total: number;
  loading: boolean;
  fetchTasks: (params?: { page?: number; agent_name?: string }) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  total: 0,
  loading: false,

  fetchTasks: async (params) => {
    set({ loading: true });
    try {
      const { data } = await taskApi.list(params);
      set({ tasks: data.items, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
