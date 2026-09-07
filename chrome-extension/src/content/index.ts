import type { DanmakuAdapter, DanmakuMessage } from "@/shared/types";
import { DANMAKU_DEDUP_WINDOW } from "@/shared/constants";

let activeAdapter: DanmakuAdapter | null = null;
let batchBuffer: DanmakuMessage[] = [];
let batchTimer: ReturnType<typeof setInterval> | null = null;

function detectPlatform(): string {
  const host = location.hostname;
  if (host.includes("douyin.com")) return "douyin";
  if (host.includes("taobao.com")) return "taobao";
  if (host.includes("kuaishou.com")) return "kuaishou";
  if (host.includes("xiaohongshu.com")) return "xiaohongshu";
  return "unknown";
}

async function loadAdapter(platform: string): Promise<DanmakuAdapter | null> {
  switch (platform) {
    case "douyin": {
      const { DouyinAdapter } = await import("./adapters/douyin");
      return new DouyinAdapter();
    }
    case "taobao": {
      const { TaobaoAdapter } = await import("./adapters/taobao");
      return new TaobaoAdapter();
    }
    case "kuaishou": {
      const { KuaishouAdapter } = await import("./adapters/kuaishou");
      return new KuaishouAdapter();
    }
    case "xiaohongshu": {
      const { XiaohongshuAdapter } = await import("./adapters/xiaohongshu");
      return new XiaohongshuAdapter();
    }
    default:
      return null;
  }
}

const recentMessages = new Map<string, number>();

function dedup(msg: DanmakuMessage): boolean {
  const key = `${msg.username}:${msg.content}`;
  const now = Date.now();
  const last = recentMessages.get(key);
  if (last && now - last < DANMAKU_DEDUP_WINDOW) return false;
  recentMessages.set(key, now);
  if (recentMessages.size > 1000) {
    const cutoff = now - 5000;
    for (const [k, t] of recentMessages) {
      if (t < cutoff) recentMessages.delete(k);
    }
  }
  return true;
}

function startBatchFlush() {
  if (batchTimer) return;
  batchTimer = setInterval(() => {
    if (batchBuffer.length > 0) {
      const messages = [...batchBuffer];
      batchBuffer = [];
      chrome.runtime.sendMessage({
        action: "batch_danmaku",
        messages,
        currentTopic: "",
      });
    }
  }, 2000);
}

function stopBatchFlush() {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
}

async function startCapture() {
  const platform = detectPlatform();
  if (platform === "unknown") return;

  const adapter = await loadAdapter(platform);
  if (!adapter || !adapter.detect()) return;

  activeAdapter = adapter;
  startBatchFlush();

  adapter.startCapture((msg) => {
    if (dedup(msg)) {
      batchBuffer.push(msg);
      chrome.runtime.sendMessage({
        action: "danmaku_captured",
        message: msg,
      });
    }
  });
}

function stopCapture() {
  if (activeAdapter) {
    activeAdapter.stopCapture();
    activeAdapter = null;
  }
  stopBatchFlush();
  batchBuffer = [];
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "start_capture") {
    startCapture().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === "stop_capture") {
    stopCapture();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.action === "get_platform") {
    sendResponse({ platform: detectPlatform() });
    return true;
  }
});

startCapture();
