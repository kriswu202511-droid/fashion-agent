import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Space, Tag, Typography, Spin, Divider, message } from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  ThunderboltOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { livestreamApi, type LivestreamSession, type LivestreamMsg } from '@/services/livestream';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const categoryColors: Record<string, string> = {
  '提问': 'blue',
  '互动': 'green',
  '下单意向': 'orange',
  '投诉': 'red',
  '其他': 'default',
};

interface DisplayMessage extends LivestreamMsg {
  aiReply?: string;
}

export default function PromptPanel() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<LivestreamSession | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [script, setScript] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const danmakuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await livestreamApi.getSession(sessionId);
      setSession(res.data);
      setScript(res.data.script || '');
      setMessages(
        (res.data.messages || []).map((m) => ({ ...m, aiReply: m.response })).reverse()
      );
      setIsLive(res.data.status === 'live');
    } catch {
      message.error('加载会话失败');
    }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 60000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  useEffect(() => {
    if (danmakuRef.current) {
      danmakuRef.current.scrollTop = danmakuRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = async () => {
    if (!sessionId) return;
    try {
      await livestreamApi.startSession(sessionId);
      setIsLive(true);
      setElapsed(0);
      message.success('直播已开始');
    } catch {
      message.error('操作失败');
    }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    try {
      await livestreamApi.endSession(sessionId);
      setIsLive(false);
      message.success('直播已结束');
    } catch {
      message.error('操作失败');
    }
  };

  const handleSendDanmaku = async () => {
    if (!sessionId || !inputValue.trim()) return;
    setSending(true);
    try {
      const res = await livestreamApi.sendDanmaku(sessionId, inputValue.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: res.data.id,
          content: res.data.content,
          source: 'user',
          response: res.data.response,
          category: res.data.category,
          aiReply: res.data.response,
        },
      ]);
      setInputValue('');
    } catch {
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendDanmaku();
    }
  };

  const handleRhythm = async () => {
    if (!sessionId) return;
    try {
      const res = await livestreamApi.getRhythm(sessionId, { elapsed_minutes: elapsed });
      const data = res.data;
      message.info(data.suggestion || JSON.stringify(data));
    } catch {
      message.error('获取节奏建议失败');
    }
  };

  const handleUrgent = async () => {
    if (!sessionId) return;
    try {
      const res = await livestreamApi.generateUrgent(sessionId, {
        product_info: '',
        viewer_count: 0,
      });
      const data = res.data;
      message.info(data.urgent_script || JSON.stringify(data));
    } catch {
      message.error('生成促单话术失败');
    }
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  let parsedScript: unknown = script;
  try { parsedScript = JSON.parse(script); } catch { /* keep raw */ }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
      <div style={{ padding: '8px 16px', background: '#16213e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#fff' }} onClick={() => navigate('/agents/livestream')} />
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{session.title}</span>
          <Tag color={isLive ? 'red' : 'default'}>{isLive ? '直播中' : session.status}</Tag>
          {isLive && <Text style={{ color: '#aaa' }}>{elapsed} 分钟</Text>}
        </Space>
        <Space>
          {!isLive ? (
            <Button type="primary" danger icon={<ThunderboltOutlined />} onClick={handleStart}>开始直播</Button>
          ) : (
            <Button icon={<StopOutlined />} onClick={handleEnd} style={{ background: '#333', color: '#fff', borderColor: '#555' }}>结束直播</Button>
          )}
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: 16, overflow: 'auto', borderRight: '1px solid #333' }}>
          <h3 style={{ color: '#e0e0e0', marginBottom: 12 }}>
            <ReloadOutlined style={{ marginRight: 8 }} />
            提词脚本
          </h3>
          <div style={{ background: '#0f3460', borderRadius: 8, padding: 16, color: '#e0e0e0', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 15 }}>
            {typeof parsedScript === 'object' && parsedScript !== null ? (
              <ScriptRenderer data={parsedScript} />
            ) : (
              String(parsedScript || '暂无脚本，请先创建直播会话')
            )}
          </div>
        </div>

        <div style={{ width: 420, display: 'flex', flexDirection: 'column', background: '#16213e' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #333' }}>
            <Text style={{ color: '#e0e0e0', fontWeight: 600 }}>弹幕 & AI 回复</Text>
          </div>

          <div ref={danmakuRef} style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
                暂无弹幕，手动输入模拟弹幕测试
              </div>
            )}
            {messages.map((msg) => (
              <Card
                key={msg.id}
                size="small"
                style={{ marginBottom: 8, background: '#1a1a2e', borderColor: '#333' }}
                bodyStyle={{ padding: '8px 12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>观众</Text>
                  <Tag color={categoryColors[msg.category] || 'default'} style={{ marginRight: 0 }}>
                    {msg.category || '其他'}
                  </Tag>
                </div>
                <Paragraph style={{ color: '#e0e0e0', margin: 0 }}>{msg.content}</Paragraph>
                {msg.aiReply && (
                  <>
                    <Divider style={{ margin: '6px 0', borderColor: '#333' }} />
                    <div style={{ background: '#0f3460', borderRadius: 6, padding: '6px 10px' }}>
                      <Text style={{ color: '#53a8ff', fontSize: 12 }}>AI 建议回复：</Text>
                      <Paragraph style={{ color: '#e0e0e0', margin: '2px 0 0', fontSize: 13 }}>
                        {msg.aiReply}
                      </Paragraph>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid #333' }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入弹幕内容..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ background: '#1a1a2e', color: '#e0e0e0', borderColor: '#444' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sending}
                onClick={handleSendDanmaku}
                style={{ height: 'auto' }}
              />
            </Space.Compact>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Button size="small" onClick={handleRhythm} style={{ flex: 1, background: '#333', color: '#e0e0e0', borderColor: '#555' }}>
                节奏建议
              </Button>
              <Button size="small" onClick={handleUrgent} style={{ flex: 1, background: '#333', color: '#e0e0e0', borderColor: '#555' }}>
                促单话术
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScriptRenderer({ data }: { data: unknown }) {
  if (typeof data !== 'object' || data === null) return <>{String(data)}</>;

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj)) {
    return (
      <>
        {obj.map((item, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <ScriptRenderer data={item} />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Object.entries(obj).map(([key, val]) => {
        const label = key.replace(/_/g, ' ');
        if (typeof val === 'object' && val !== null) {
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#53a8ff', display: 'block', marginBottom: 4 }}>{label}</Text>
              <div style={{ paddingLeft: 12 }}>
                <ScriptRenderer data={val} />
              </div>
            </div>
          );
        }
        return (
          <div key={key} style={{ marginBottom: 8 }}>
            <Text strong style={{ color: '#53a8ff' }}>{label}：</Text>
            <Text style={{ color: '#e0e0e0' }}>{String(val)}</Text>
          </div>
        );
      })}
    </>
  );
}
