const WS_BASE_URL = 'ws://47.102.219.206';

export interface WSMessage {
  type: string;
  source_agent?: string;
  target_agent?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

type MessageHandler = (msg: WSMessage) => void;

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];
const HEARTBEAT_INTERVAL = 30000;

class WebSocketClient {
  private socketTask: UniApp.SocketTask | null = null;
  private listeners = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _connected = false;
  private _path = '/ws';
  private manualClose = false;

  get connected() {
    return this._connected;
  }

  connect(path = '/ws') {
    const token = uni.getStorageSync('token');
    if (!token) return;

    this.manualClose = false;
    this._path = path;
    const url = `${WS_BASE_URL}${path}?token=${token}`;

    this.socketTask = uni.connectSocket({
      url,
      success: () => {},
      fail: () => {
        this.scheduleReconnect();
      },
    });

    this.socketTask.onOpen(() => {
      this._connected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit({ type: '__connected__', data: {}, timestamp: new Date().toISOString() });
    });

    this.socketTask.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data as string) as WSMessage;
        this.emit(msg);
      } catch {
        // ignore malformed messages
      }
    });

    this.socketTask.onClose(() => {
      this._connected = false;
      this.stopHeartbeat();
      this.socketTask = null;
      this.emit({ type: '__disconnected__', data: {}, timestamp: new Date().toISOString() });
      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    });

    this.socketTask.onError(() => {
      this._connected = false;
      this.stopHeartbeat();
    });
  }

  disconnect() {
    this.manualClose = true;
    this.clearReconnect();
    this.stopHeartbeat();
    if (this.socketTask) {
      this.socketTask.close({});
      this.socketTask = null;
    }
    this._connected = false;
  }

  on(type: string, handler: MessageHandler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  off(type: string, handler: MessageHandler) {
    this.listeners.get(type)?.delete(handler);
  }

  private emit(msg: WSMessage) {
    const handlers = this.listeners.get(msg.type);
    if (handlers) {
      handlers.forEach((h) => h(msg));
    }
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((h) => h(msg));
    }
  }

  private scheduleReconnect() {
    if (this.manualClose) return;
    const delay = RECONNECT_DELAYS[
      Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1)
    ];
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect(this._path);
    }, delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socketTask && this._connected) {
        this.socketTask.send({ data: 'ping' });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const wsClient = new WebSocketClient();
