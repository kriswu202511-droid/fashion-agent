import { DEFAULT_BACKEND_URL } from "@/shared/constants";
import type { DanmakuMessage } from "@/shared/types";

let ws: WebSocket | null = null;
let sessionId: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

async function getConfig(): Promise<{ backendUrl: string; token: string }> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["backendUrl", "token"], (result) => {
      resolve({
        backendUrl: result.backendUrl || DEFAULT_BACKEND_URL,
        token: result.token || "",
      });
    });
  });
}

async function connectWebSocket(sid: string) {
  const config = await getConfig();
  if (!config.token) return;

  const wsUrl = `${config.backendUrl.replace("http", "ws")}/livestream/ws/${sid}?token=${config.token}`;
  ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "livestream.danmaku_reply" && msg.data) {
        const aiReply = {
          id: crypto.randomUUID(),
          session_id: msg.data.session_id || sid,
          original_message: msg.data.content || "",
          reply: msg.data.response || "",
          category: msg.data.category || "其他",
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        chrome.runtime.sendMessage({ action: "ai_reply", data: aiReply });
      }
    } catch (e) {
      console.error("WS message parse error:", e);
    }
  };

  ws.onclose = () => {
    ws = null;
    scheduleReconnect(sid);
  };

  ws.onerror = (e) => {
    console.error("WebSocket error:", e);
  };
}

function scheduleReconnect(sid: string) {
  if (reconnectAttempts >= 5) return;
  reconnectTimer = setTimeout(() => {
    reconnectAttempts++;
    connectWebSocket(sid);
  }, 3000);
}

function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  ws = null;
  reconnectAttempts = 0;
}

async function handleExtensionConnect(
  platform: string,
  roomUrl: string,
  roomTitle: string,
  theme: string,
  products: string
) {
  const config = await getConfig();
  const res = await fetch(`${config.backendUrl}/api/livestream/extension/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      platform,
      room_url: roomUrl,
      room_title: roomTitle,
      theme,
      products,
    }),
  });
  const data = await res.json();
  const sid = data.session_id || data.id;
  if (sid) {
    sessionId = sid;
    connectWebSocket(sid);
  }
  return data;
}

async function handleBatchDanmaku(messages: DanmakuMessage[], currentTopic: string) {
  if (!sessionId) return;
  const config = await getConfig();
  await fetch(`${config.backendUrl}/api/livestream/session/${sessionId}/danmaku/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({ messages, current_topic: currentTopic }),
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "connect") {
    handleExtensionConnect(
      msg.platform,
      msg.roomUrl,
      msg.roomTitle,
      msg.theme,
      msg.products
    ).then(sendResponse);
    return true;
  }
  if (msg.action === "batch_danmaku") {
    handleBatchDanmaku(msg.messages, msg.currentTopic).then(sendResponse);
    return true;
  }
  if (msg.action === "manual_danmaku") {
    handleBatchDanmaku([msg.message], msg.currentTopic || "").then(sendResponse);
    return true;
  }
  if (msg.action === "disconnect") {
    disconnectWebSocket();
    sessionId = null;
    sendResponse({ ok: true });
    return true;
  }
  if (msg.action === "get_session") {
    sendResponse({ sessionId });
    return true;
  }
});
