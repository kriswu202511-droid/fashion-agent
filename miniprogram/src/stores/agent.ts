import { defineStore } from 'pinia';
import { ref } from 'vue';
import { get, post } from '@/services/api';

interface Agent {
  name: string;
  description: string;
  version: string;
  icon: string;
  status: 'idle' | 'running' | 'error';
}

interface AgentRunResult {
  task_id: string;
  status: string;
  output_data: Record<string, unknown> | null;
}

export const useAgentStore = defineStore('agent', () => {
  const agents = ref<Agent[]>([]);
  const loading = ref(false);

  async function fetchAgents() {
    loading.value = true;
    try {
      const data = await get<{ agents: Agent[] }>('/agents');
      agents.value = data.agents;
    } catch {
      uni.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      loading.value = false;
    }
  }

  async function runAgent(name: string, input: Record<string, unknown>): Promise<AgentRunResult> {
    return post<AgentRunResult>('/agents/run', { agent_name: name, input_data: input });
  }

  return { agents, loading, fetchAgents, runAgent };
});
