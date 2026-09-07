import type { DanmakuAdapter, DanmakuMessage } from "../../shared/types";

const SELECTORS = {
  container: '[class*="chat-list"], [class*="comment-list"], .chat-item',
  text: '[class*="chat-text"], [class*="comment-text"], [class*="content"]',
  username: '[class*="chat-name"], [class*="user-name"], [class*="nickname"]',
};

export class TaobaoAdapter implements DanmakuAdapter {
  platform = "taobao" as const;
  private observer: MutationObserver | null = null;

  detect(): boolean {
    return location.hostname.includes("taobao.com");
  }

  startCapture(cb: (msg: DanmakuMessage) => void): void {
    const container = this.findContainer();
    if (!container) {
      setTimeout(() => this.startCapture(cb), 2000);
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            const msg = this.parseNode(node);
            if (msg) cb(msg);
          }
        }
      }
    });

    this.observer.observe(container, { childList: true, subtree: true });
  }

  stopCapture(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private findContainer(): Element | null {
    const selectors = SELECTORS.container.split(", ");
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el.parentElement || el;
    }
    return null;
  }

  private parseNode(node: HTMLElement): DanmakuMessage | null {
    const textEl = node.querySelector(SELECTORS.text);
    const nameEl = node.querySelector(SELECTORS.username);
    const content = textEl?.textContent?.trim() || node.textContent?.trim() || "";
    if (!content) return null;

    return {
      content,
      username: nameEl?.textContent?.trim() || "",
      timestamp: Date.now(),
    };
  }
}
