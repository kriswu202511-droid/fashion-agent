import { defineStore } from 'pinia';
import { ref } from 'vue';
import { wsClient, type WSMessage } from '@/services/websocket';

export const useWebSocketStore = defineStore('websocket', () => {
  const connected = ref(false);
  const messages = ref<WSMessage[]>([]);
  const MAX_HISTORY = 50;

  function connect() {
    if (wsClient.connected) return;

    wsClient.on('__connected__', () => {
      connected.value = true;
    });

    wsClient.on('__disconnected__', () => {
      connected.value = false;
    });

    wsClient.on('*', (msg) => {
      if (msg.type.startsWith('__')) return;
      messages.value.push(msg);
      if (messages.value.length > MAX_HISTORY) {
        messages.value.shift();
      }
    });

    wsClient.connect('/ws');
  }

  function disconnect() {
    wsClient.disconnect();
    connected.value = false;
  }

  function clearMessages() {
    messages.value = [];
  }

  return { connected, messages, connect, disconnect, clearMessages };
});
