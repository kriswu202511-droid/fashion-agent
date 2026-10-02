import api from './api';
import type { PaginatedResponse } from '@/types';

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

  listKnowledge(page: number = 1, page_size: number = 20) {
    return api.get<PaginatedResponse<KnowledgeItem>>('/cs/knowledge', { params: { page, page_size } });
  },

  createKnowledge(data: { category: string; title: string; content: string }) {
    return api.post('/cs/knowledge', data);
  },

  syncKnowledge() {
    return api.post<{ synced: number; total_in_index: number }>('/cs/knowledge/sync');
  },

  history(sessionId?: string, page: number = 1, page_size: number = 20) {
    return api.get<PaginatedResponse<ChatMsg>>('/cs/history', { params: { session_id: sessionId, page, page_size } });
  },
};
