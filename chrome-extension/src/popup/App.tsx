import { useState, useEffect } from "react";
import { DEFAULT_BACKEND_URL } from "@/shared/constants";

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [platform, setPlatform] = useState("检测中...");

  useEffect(() => {
    chrome.storage.local.get(["backendUrl", "token"], (result) => {
      if (result.backendUrl) setBackendUrl(result.backendUrl);
      if (result.token) setToken(result.token);
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "get_platform" }, (res) => {
          if (chrome.runtime.lastError) {
            setPlatform("当前页面不支持");
            return;
          }
          if (res?.platform) {
            const names: Record<string, string> = {
              douyin: "抖音直播",
              taobao: "淘宝直播",
              kuaishou: "快手直播",
              xiaohongshu: "小红书直播",
              unknown: "未识别平台",
            };
            setPlatform(names[res.platform] || res.platform);
          } else {
            setPlatform("未识别平台");
          }
        });
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ backendUrl, token }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleOpenSidePanel = () => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  };

  return (
    <div style={{ padding: 16, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>直播AI助手 设置</h3>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>当前平台</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{platform}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>后端地址</div>
        <input
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>JWT Token</div>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          placeholder="输入登录 Token"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} style={btnStyle("#1677ff")}>
          {saved ? "已保存" : "保存"}
        </button>
        <button onClick={handleOpenSidePanel} style={btnStyle("#52c41a")}>
          打开面板
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #d9d9d9",
  borderRadius: 4,
  fontSize: 13,
  boxSizing: "border-box",
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    flex: 1,
    padding: "6px 0",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
  };
}
