import { useState, useEffect, useRef } from "react";
import type { AIReply, DanmakuMessage } from "@/shared/types";

interface DanmakuEntry {
  id: string;
  message: DanmakuMessage;
  reply?: AIReply;
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [entries, setEntries] = useState<DanmakuEntry[]>([]);
  const [topic, setTopic] = useState("");
  const [manualUsername, setManualUsername] = useState("");
  const [manualContent, setManualContent] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (msg: { action: string; data?: AIReply; message?: DanmakuMessage }) => {
      if (msg.action === "danmaku_captured" && msg.message) {
        setEntries((prev) => [
          ...prev,
          { id: crypto.randomUUID(), message: msg.message! },
        ]);
      }
      if (msg.action === "ai_reply" && msg.data) {
        const reply = msg.data;
        setEntries((prev) =>
          prev.map((e) =>
            e.message.content === reply.original_message && !e.reply
              ? { ...e, reply }
              : e
          )
        );
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries]);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "get_session" }, (res) => {
      setConnected(!!res?.sessionId);
    });
  }, []);

  const handleConnect = () => {
    chrome.runtime.sendMessage(
      {
        action: "connect",
        platform: "douyin",
        roomUrl: location.href,
        roomTitle: document.title,
        theme: topic || "夏季新款上新",
        products: "",
      },
      () => setConnected(true)
    );
  };

  const handleDisconnect = () => {
    chrome.runtime.sendMessage({ action: "disconnect" });
    setConnected(false);
  };

  const handleManualSend = () => {
    if (!manualContent.trim()) return;
    const message: DanmakuMessage = {
      username: manualUsername.trim() || "手动输入",
      content: manualContent.trim(),
      timestamp: Date.now(),
      platform: "manual",
    };
    chrome.runtime.sendMessage({ action: "manual_danmaku", message });
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), message }]);
    setManualContent("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleManualSend();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f5f5" }}>
      <div style={{ padding: "12px 16px", background: "#fff", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>直播AI助手</h3>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#52c41a" : "#d9d9d9",
              display: "inline-block",
            }}
          />
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="当前话题 (如: 夏季连衣裙)"
            style={{ flex: 1, padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 4, fontSize: 13 }}
          />
          {connected ? (
            <button onClick={handleDisconnect} style={btnStyle("#ff4d4f")}>
              断开
            </button>
          ) : (
            <button onClick={handleConnect} style={btnStyle("#1677ff")}>
              连接
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
        {entries.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 }}>
            {connected ? "等待弹幕中..." : "点击「连接」开始直播辅助"}
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} style={{ marginBottom: 12 }}>
            <div
              style={{
                background: "#fff",
                padding: "8px 12px",
                borderRadius: 8,
                borderLeft: "3px solid #1677ff",
              }}
            >
              <div style={{ fontSize: 12, color: "#999" }}>
                {entry.message.username || "观众"}
              </div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{entry.message.content}</div>
            </div>
            {entry.reply && (
              <div
                style={{
                  background: "#f6ffed",
                  padding: "8px 12px",
                  borderRadius: 8,
                  borderLeft: "3px solid #52c41a",
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 12, color: "#52c41a", fontWeight: 500 }}>
                  AI 回复
                </div>
                <div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.6 }}>
                  {entry.reply.reply}
                </div>
              </div>
            )}
            {connected && !entry.reply && (
              <div
                style={{
                  fontSize: 12,
                  color: "#bbb",
                  marginTop: 4,
                  paddingLeft: 4,
                }}
              >
                思考中...
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #e8e8e8" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontWeight: 500 }}>
          手动输入弹幕
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={manualUsername}
            onChange={(e) => setManualUsername(e.target.value)}
            placeholder="用户名 (可选)"
            style={{
              width: 100,
              padding: "6px 8px",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              fontSize: 13,
            }}
          />
          <input
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入弹幕内容，按 Enter 发送"
            style={{
              flex: 1,
              padding: "6px 8px",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              fontSize: 13,
            }}
          />
          <button
            onClick={handleManualSend}
            disabled={!manualContent.trim()}
            style={{
              ...btnStyle("#1677ff"),
              opacity: manualContent.trim() ? 1 : 0.5,
              cursor: manualContent.trim() ? "pointer" : "not-allowed",
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: "4px 16px",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
  };
}
