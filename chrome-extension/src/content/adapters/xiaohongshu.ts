import type { DanmakuAdapter, DanmakuMessage } from "../../shared/types";

export class XiaohongshuAdapter implements DanmakuAdapter {
  platform = "xiaohongshu" as const;
  private seenMessageIds = new Set<string>();
  private messageHandler: ((e: MessageEvent) => void) | null = null;
  private observer: MutationObserver | null = null;

  detect(): boolean {
    return location.hostname.includes("xiaohongshu.com");
  }

  startCapture(cb: (msg: DanmakuMessage) => void): void {
    this.requestMainWorldInjection().then(() => {
      this.messageHandler = (e: MessageEvent) => {
        if (e.data?.source !== "fashion-xhs-interceptor") return;
        if (e.data?.type === "api_response" && e.data?.data) {
          this.extractMessages(e.data.url, e.data.data, cb);
        }
      };
      window.addEventListener("message", this.messageHandler);
      this.observeChatDOM(cb);
      console.log("[XHS] Capture started — main world interceptor confirmed + DOM observer active");
    });
  }

  stopCapture(): void {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.seenMessageIds.clear();
  }

  private requestMainWorldInjection(): Promise<void> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "inject_xhs_interceptor" }, (response) => {
        if (response?.ok) {
          console.log("[XHS] Main world interceptor injected via chrome.scripting");
        } else {
          console.warn("[XHS] Injection response:", response);
        }
        resolve();
      });
    });
  }

  private extractMessages(_url: string, data: any, cb: (msg: DanmakuMessage) => void): void {
    const messages = this.findMessages(data);
    for (const msg of messages) {
      const id = `${msg.username}:${msg.content}:${msg.timestamp}`;
      if (!this.seenMessageIds.has(id)) {
        this.seenMessageIds.add(id);
        console.log("[XHS] Captured danmaku:", msg.username, msg.content);
        cb(msg);
      }
    }
  }

  private findMessages(data: any): DanmakuMessage[] {
    const messages: DanmakuMessage[] = [];

    // Try many possible response structures
    const candidates = [
      data?.data?.comments,
      data?.data?.messages,
      data?.data?.comment_list,
      data?.data?.chat_list,
      data?.data?.list,
      data?.data?.result,
      data?.comments,
      data?.messages,
      data?.comment_list,
      data?.list,
    ].filter(Array.isArray);

    for (const list of candidates) {
      for (const item of list) {
        const content = item?.content || item?.text || item?.message || item?.comment || "";
        const username = item?.user?.nickname || item?.user?.name || item?.nickname
          || item?.user_name || item?.sender?.nickname || "";
        const timestamp = item?.create_time || item?.timestamp || item?.time || Date.now();

        if (content && username) {
          messages.push({
            content,
            username,
            timestamp: typeof timestamp === "number" ? timestamp : Date.now(),
          });
        }
      }
    }

    return messages;
  }

  private observeChatDOM(cb: (msg: DanmakuMessage) => void): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          // Try various selectors for chat messages
          const chatItems = node.querySelectorAll?.(
            '[class*="comment"], [class*="chat-item"], [class*="danmaku"], [class*="message-item"]'
          ) || [];

          for (const item of chatItems) {
            const nicknameEl = item.querySelector('[class*="nickname"], [class*="name"], [class*="user"]');
            const contentEl = item.querySelector('[class*="content"], [class*="text"], [class*="msg"]');

            if (nicknameEl && contentEl) {
              const username = nicknameEl.textContent?.trim() || "";
              const text = contentEl.textContent?.trim() || "";
              if (username && text) {
                const id = `dom:${username}:${text}`;
                if (!this.seenMessageIds.has(id)) {
                  this.seenMessageIds.add(id);
                  cb({ content: text, username, timestamp: Date.now() });
                }
              }
            }
          }

          // Also handle enter messages
          const enterItems = node.querySelectorAll?.('.enter-msgs [class*="nickname"], .enter-msgs > *') || [];
          for (const item of enterItems) {
            const nicknameEl = item.querySelector?.('.nickname') || (item.classList?.contains('nickname') ? item : null);
            const msgEl = item.querySelector?.('.msg-content') || item.querySelector?.('[class*="msg"]');
            if (nicknameEl && msgEl) {
              const username = nicknameEl.textContent?.trim() || "";
              const text = msgEl.textContent?.trim() || "";
              if (username && text) {
                const id = `enter:${username}:${text}`;
                if (!this.seenMessageIds.has(id)) {
                  this.seenMessageIds.add(id);
                  cb({ content: text, username, timestamp: Date.now() });
                }
              }
            }
          }
        }
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }
}
