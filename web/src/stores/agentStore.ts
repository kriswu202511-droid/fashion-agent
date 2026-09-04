import { create } from 'zustand';
import type { Agent } from '@/types';
import { agentApi } from '@/services/agent';

interface AgentState {
  agents: Agent[];
  selectedAgent: string | null;
  loading: boolean;
  fetchAgents: () => Promise<void>;
  selectAgent: (name: string | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  loading: false,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const { data } = await agentApi.list();
      set({ agents: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  selectAgent: (name) => set({ selectedAgent: name }),
}));
