import api from './api';

export interface CSReply {
  session_id: string;
  reply: string;
  confidence: number;
  need_human: boolean;
  context_docs: { title: string; score: number }[];
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
  created_at?: string;
}

export interface ChatMsg {
  id: string;
  role: string;
  content: string;
  confidence: number;
  need_human: boolean;
  created_at?: string;
}

export const csApi = {
  chat(question: string, sessionId?: string, buyerName?: string) {
    return api.post<CSReply>('/cs/chat', {
      question,
      session_id: sessionId,
      buyer_name: buyerName || '',
    });
  },

  listKnowledge() {
    return api.get<KnowledgeItem[]>('/cs/knowledge');
  },

  createKnowledge(data: { category: string; title: string; content: string }) {
    return api.post('/cs/knowledge', data);
  },

  syncKnowledge() {
    return api.post<{ synced: number; total_in_index: number }>('/cs/knowledge/sync');
  },

  history(sessionId?: string) {
    return api.get<ChatMsg[]>('/cs/history', { params: { session_id: sessionId } });
  },
};
