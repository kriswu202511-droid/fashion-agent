export const DEFAULT_BACKEND_URL = "http://47.102.219.206";
export const WS_RECONNECT_INTERVAL = 3000;
export const WS_MAX_RECONNECT_ATTEMPTS = 5;
export const DANMAKU_BATCH_INTERVAL = 2000;
export const DANMAKU_DEDUP_WINDOW = 100;

export const PLATFORM_HOSTS: Record<string, string[]> = {
  douyin: ["live.douyin.com"],
  taobao: ["live.taobao.com", "www.taobao.com"],
  kuaishou: ["live.kuaishou.com"],
  xiaohongshu: ["www.xiaohongshu.com"],
};
