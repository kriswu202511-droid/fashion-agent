import { ref, onUnmounted } from 'vue';
import { wsClient, type WSMessage } from '@/services/websocket';

export function useSessionWebSocket(sessionId: () => string) {
  const connected = ref(false);
  const messages = ref<WSMessage[]>([]);
  const handlers = new Map<string, (msg: WSMessage) => void>();

  function connect() {
    const sid = sessionId();
    if (!sid) return;

    const token = uni.getStorageSync('token');
    if (!token) return;

    const url = `ws://47.102.219.206/livestream/ws/${sid}?token=${token}`;
    const socketTask = uni.connectSocket({ url });

    socketTask.onOpen(() => {
      connected.value = true;
    });

    socketTask.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data as string) as WSMessage;
        messages.value.push(msg);
        if (messages.value.length > 100) messages.value.shift();

        const handler = handlers.get(msg.type);
        if (handler) handler(msg);
      } catch {
        // ignore malformed messages
      }
    });

    socketTask.onClose(() => {
      connected.value = false;
    });

    socketTask.onError(() => {
      connected.value = false;
    });

    onUnmounted(() => {
      socketTask.close({});
    });
  }

  function on(type: string, handler: (msg: WSMessage) => void) {
    handlers.set(type, handler);
  }

  function clearMessages() {
    messages.value = [];
  }

  return { connected, messages, connect, on, clearMessages };
}
