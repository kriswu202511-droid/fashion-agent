import { DEFAULT_BACKEND_URL } from "@/shared/constants";
import type { DanmakuMessage } from "@/shared/types";

let ws: WebSocket | null = null;
let sessionId: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let lastPlatform = "";
let lastRoomUrl = "";
let lastRoomTitle = "";
let lastTheme = "";
let lastProducts = "";

function persistSession() {
  chrome.storage.local.set({
    sessionId,
    lastPlatform,
    lastRoomUrl,
    lastRoomTitle,
    lastTheme,
    lastProducts,
  });
}

function restoreSession(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["sessionId", "lastPlatform", "lastRoomUrl", "lastRoomTitle", "lastTheme", "lastProducts"],
      (result) => {
        if (result.sessionId) {
          sessionId = result.sessionId;
          lastPlatform = result.lastPlatform || "";
          lastRoomUrl = result.lastRoomUrl || "";
          lastRoomTitle = result.lastRoomTitle || "";
          lastTheme = result.lastTheme || "";
          lastProducts = result.lastProducts || "";
          console.log("[INIT] Restored session:", sessionId);
          connectWebSocket(sessionId as string);
        }
        resolve();
      }
    );
  });
}

restoreSession();

async function getConfig(): Promise<{ backendUrl: string; token: string }> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["backendUrl", "token"], (result) => {
      resolve({
        backendUrl: result.backendUrl || DEFAULT_BACKEND_URL,
        token: result.token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTExZTEzMi1jMjRmLTQzYjktYTkxNi1jMWU0NDkxYmZhNWEiLCJleHAiOjE3ODkwNDA1MDJ9.PFQX-0NqLEo0t43uRUJNTWkf-rdOHemUtHCjenoxZyk",
      });
    });
  });
}

async function connectWebSocket(sid: string) {
  const config = await getConfig();
  if (!config.token) {
    console.log("[WS] No token, abortorting connection");
    return;
  }

  const wsUrl = `${config.backendUrl.replace("http", "ws")}/livestream/ws/${sid}?token=${config.token}`;
  console.log("[WS] Connecting to:", wsUrl);

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("[WS] Connected successfully for session:", sid);
    reconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    console.log("[WS] Raw message received:", event.data);
    try {
      const msg = JSON.parse(event.data);
      console.log("[WS] Parsed message type:", msg.type);
      if (msg.type === "livestream.danmaku_reply" && msg.data) {
        const aiReply = {
          id: crypto.randomUUID(),
          session_id: msg.data.session_id || sid,
          original_message: msg.data.content || "",
          reply: msg.data.response || "",
          category: msg.data.category || "其他",
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        console.log("[WS] Sending ai_reply to Side Panel:", aiReply.original_message);
        chrome.runtime.sendMessage({ action: "ai_reply", data: aiReply });
      }
    } catch (e) {
      console.error("[WS] Message parse error:", e);
    }
  };

  ws.onclose = (event) => {
    console.log("[WS] Closed, code:", event.code, "reason:", event.reason);
    ws = null;
    if (sessionId) {
      scheduleReconnect(sid);
    }
  };

  ws.onerror = (e) => {
    console.error("[WS] Error:", e);
  };
}

function scheduleReconnect(sid: string) {
  if (reconnectAttempts >= 5) {
    console.log("[WS] Max reconnect attempts reached, giving up");
    return;
  }
  reconnectAttempts++;
  console.log(`[WS] Reconnect attempt ${reconnectAttempts}/5 in 3s`);
  reconnectTimer = setTimeout(() => {
    connectWebSocket(sid);
  }, 3000);
}

function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  ws = null;
  sessionId = null;
  reconnectAttempts = 0;
  chrome.storage.local.remove([
    "sessionId",
    "lastPlatform",
    "lastRoomUrl",
    "lastRoomTitle",
    "lastTheme",
    "lastProducts",
  ]);
}

async function handleExtensionConnect(
  platform: string,
  roomUrl: string,
  roomTitle: string,
  theme: string,
  products: string
) {
  if (sessionId && ws && ws.readyState === WebSocket.OPEN) {
    console.log("[CONNECT] Reusing existing session:", sessionId);
    return { session_id: sessionId, status: "live", reused: true };
  }

  lastPlatform = platform;
  lastRoomUrl = roomUrl;
  lastRoomTitle = roomTitle;
  lastTheme = theme;
  lastProducts = products;

  const config = await getConfig();
  const url = `${config.backendUrl}/api/livestream/extension/connect`;
  console.log("[CONNECT] Creating new session via API:", url);
  try {
    const res = await fetch(url, {
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
    console.log("[CONNECT] Response status:", res.status);
    const text = await res.text();
    console.log("[CONNECT] Response body:", text);
    if (!res.ok) {
      console.error("[CONNECT] API error:", res.status, text);
      return { error: `HTTP ${res.status}`, detail: text };
    }
    const data = JSON.parse(text);
    console.log("[CONNECT] Parsed API response:", data);
    const sid = data.session_id || data.id;
    if (sid) {
      sessionId = sid;
      persistSession();
      connectWebSocket(sid);
    }
    return data;
  } catch (e) {
    console.error("[CONNECT] Fetch failed:", e);
    return { error: String(e) };
  }
}

async function handleBatchDanmaku(messages: DanmakuMessage[], currentTopic: string) {
  if (!sessionId) {
    await restoreSession();
  }
  if (!sessionId) {
    console.log("[DANMAKU] No sessionId after restore, aborting");
    return;
  }
  const config = await getConfig();
  const url = `${config.backendUrl}/api/livestream/session/${sessionId}/danmaku/batch`;
  console.log(`[DANMAKU] Sending ${messages.length} messages to session ${sessionId}`, url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ messages, current_topic: currentTopic }),
    });
    console.log("[DANMAKU] Response status:", res.status);
    const text = await res.text();
    console.log("[DANMAKU] Response body:", text);
    if (!res.ok) {
      console.error("[DANMAKU] API error:", res.status, text);
      return { error: `HTTP ${res.status}`, detail: text };
    }
    const data = JSON.parse(text);
    console.log("[DANMAKU] Batch response:", data);
    return data;
  } catch (e) {
    console.error("[DANMAKU] Fetch failed:", e);
    return { error: String(e) };
  }
}

async function injectXhsInterceptor(tabId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const INJECT_ID = "__fashion_xhs_interceptor__";
        if ((window as any)[INJECT_ID]) return;
        (window as any)[INJECT_ID] = true;

        const post = (payload: any) => {
          window.postMessage({ source: "fashion-xhs-interceptor", ...payload }, "*");
        };

        const origFetch = window.fetch;
        window.fetch = async function (...args: any[]) {
          const response = await (origFetch as any).apply(this, args);
          try {
            const url = typeof args[0] === "string" ? args[0]
              : args[0] instanceof Request ? args[0].url
              : args[0]?.toString() || "";
            if (url.includes("comment") || url.includes("chat") || url.includes("danmaku") || url.includes("join_comment")) {
              const clone = response.clone();
              clone.json().then((data: any) => {
                console.log("[Fashion-XHS-Interceptor] Intercepted API:", url, JSON.stringify(data).slice(0, 500));
                post({ type: "api_response", url, data });
              }).catch(() => {});
            }
          } catch (e) {}
          return response;
        };

        const origXHROpen = XMLHttpRequest.prototype.open;
        const origXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method: string, url: any, ...rest: any[]) {
          (this as any).__fashion_url = typeof url === "string" ? url : url?.toString() || "";
          return (origXHROpen as any).call(this, method, url, ...rest);
        };
        XMLHttpRequest.prototype.send = function (body: any) {
          if ((this as any).__fashion_url && (
            (this as any).__fashion_url.includes("comment") ||
            (this as any).__fashion_url.includes("chat") ||
            (this as any).__fashion_url.includes("danmaku") ||
            (this as any).__fashion_url.includes("join_comment")
          )) {
            this.addEventListener("load", function () {
              try {
                const data = JSON.parse((this as XMLHttpRequest).responseText);
                console.log("[Fashion-XHS-Interceptor] XHR Intercepted:", (this as any).__fashion_url, JSON.stringify(data).slice(0, 500));
                post({ type: "api_response", url: (this as any).__fashion_url, data });
              } catch (e) {}
            });
          }
          return origXHRSend.call(this, body);
        };

        console.log("[Fashion-XHS-Interceptor] Installed in main world via chrome.scripting");
      },
    });
    console.log("[BG] XHS interceptor injected into tab", tabId);
    return { ok: true };
  } catch (e) {
    console.error("[BG] XHS interceptor injection failed:", e);
    return { ok: false, error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[MSG] Received action:", msg.action);
  if (msg.action === "inject_xhs_interceptor") {
    if (sender.tab?.id) {
      injectXhsInterceptor(sender.tab.id).then(sendResponse);
    } else {
      sendResponse({ ok: false, error: "No tabId" });
    }
    return true;
  }
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
    console.log("[MSG] Disconnected, sessionId cleared");
    sendResponse({ ok: true });
    return true;
  }
  if (msg.action === "get_session") {
    sendResponse({ sessionId });
    return true;
  }
});

const CONTENT_SCRIPT_MATCHES = [
  "https://live.douyin.com/*",
  "https://live.taobao.com/*",
  "https://*.taobao.com/*",
  "https://live.kuaishou.com/*",
  "https://www.xiaohongshu.com/*",
  "https://*.xiaohongshu.com/*",
];

async function reinjectContentScripts() {
  for (const pattern of CONTENT_SCRIPT_MATCHES) {
    try {
      const tabs = await chrome.tabs.query({ url: pattern });
      for (const tab of tabs) {
        if (!tab.id) continue;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
          console.log(`[REINJECT] Injected content.js into tab ${tab.id} (${tab.url})`);
        } catch (e) {
          console.warn(`[REINJECT] Failed for tab ${tab.id}:`, e);
        }
      }
    } catch (e) {
      console.warn(`[REINJECT] Query failed for ${pattern}:`, e);
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[INSTALL] Extension installed/updated, reinjecting content scripts");
  reinjectContentScripts();
});

reinjectContentScripts();
