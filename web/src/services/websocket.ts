type MessageHandler = (data: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private url: string;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.shouldReconnect = true;
    this.ws = new WebSocket(`${this.url}?token=${token}`);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.type || 'message';
        this.handlers.get(eventType)?.forEach((handler) => handler(data));
        this.handlers.get('*')?.forEach((handler) => handler(data));
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: MessageHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const wsManager = new WebSocketManager();
