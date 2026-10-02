import api from './api';
import type { PaginatedResponse } from '@/types';

export interface LivestreamSession {
  id: string;
  title: string;
  status: string;
  script?: string;
  created_at?: string;
  started_at?: string | null;
  messages?: LivestreamMsg[];
}

export interface LivestreamMsg {
  id: string;
  content: string;
  source: string;
  response: string;
  category: string;
  created_at?: string;
}

export const livestreamApi = {
  createSession(data: {
    title?: string;
    theme?: string;
    products?: string;
    duration?: string;
    promotion?: string;
    platform?: string;
    host_style?: string;
    goal?: string;
  }) {
    return api.post<LivestreamSession>('/livestream/session', data);
  },

  listSessions(page: number = 1, page_size: number = 20) {
    return api.get<PaginatedResponse<LivestreamSession>>('/livestream/sessions', { params: { page, page_size } });
  },

  getSession(sessionId: string) {
    return api.get<LivestreamSession>(`/livestream/session/${sessionId}`);
  },

  startSession(sessionId: string) {
    return api.post(`/livestream/session/${sessionId}/start`);
  },

  endSession(sessionId: string) {
    return api.post(`/livestream/session/${sessionId}/end`);
  },

  sendDanmaku(sessionId: string, content: string, currentTopic: string = '') {
    return api.post<LivestreamMsg>(`/livestream/session/${sessionId}/message`, {
      content,
      current_topic: currentTopic,
    });
  },

  getRhythm(sessionId: string, data: {
    elapsed_minutes: number;
    planned_duration?: number;
    covered_products?: string;
    viewer_count?: number;
  }) {
    return api.post(`/livestream/session/${sessionId}/rhythm`, data);
  },

  generateUrgent(sessionId: string, data: {
    product_info?: string;
    promotion?: string;
    stock_info?: string;
    viewer_count?: number;
  }) {
    return api.post(`/livestream/session/${sessionId}/urgent`, data);
  },
};
