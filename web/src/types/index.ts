export interface Agent {
  name: string;
  description: string;
  version: string;
  icon: string;
  status: 'idle' | 'running' | 'error';
  last_run_at: string | null;
  total_runs: number;
}

export interface Task {
  id: string;
  agent_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TenantSettings {
  id: string;
  user_id: string;
  store_name: string;
  store_platform: string;
  store_category: string;
  brand_style: string;
  target_audience: string;
  price_range: string;
  contact_phone: string;
  contact_wechat: string;
  return_policy: string;
  shipping_policy: string;
  faq_extra: string;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollaborationEvent {
  source_agent: string;
  event_type: string;
  target_agent: string | null;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface LivestreamSession {
  id: string;
  title: string;
  status: 'draft' | 'live' | 'ended';
  script: Record<string, unknown> | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  messages?: LivestreamMessage[];
}

export interface LivestreamMessage {
  id: string;
  session_id: string;
  content: string;
  source: 'user' | 'ai';
  response: string | null;
  category: string | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  buyer_name: string;
  status: 'active' | 'closed';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence: number | null;
  need_human: boolean;
  created_at: string;
}

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
  created_at: string;
}
