export interface DanmakuMessage {
  content: string;
  username: string;
  timestamp: number;
  platform?: string;
}

export interface AIReply {
  id: string;
  session_id: string;
  original_message: string;
  reply: string;
  category: string;
  timestamp: string;
}

export interface SessionInfo {
  id: string;
  title: string;
  platform: string;
  status: string;
  room_url: string;
  created_at: string;
}

export interface ExtensionConfig {
  backendUrl: string;
  token: string;
  autoReply: boolean;
  replyDelay: number;
}

export type Platform = "douyin" | "taobao" | "kuaishou" | "xiaohongshu";

export interface DanmakuAdapter {
  platform: Platform;
  detect(): boolean;
  startCapture(cb: (msg: DanmakuMessage) => void): void;
  stopCapture(): void;
}

export type WSMessage =
  | { type: "ai_reply"; data: AIReply }
  | { type: "session_update"; data: Partial<SessionInfo> }
  | { type: "error"; data: { message: string } };
