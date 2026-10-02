import { useState, useEffect, useRef } from 'react';
import { Tabs, Input, Button, Card, List, Tag, Space, Form, Select, message, Spin } from 'antd';
import { SendOutlined, SyncOutlined, PlusOutlined, MessageOutlined, BookOutlined } from '@ant-design/icons';
import { csApi, type CSReply, type KnowledgeItem } from '@/services/customerService';

interface DisplayMsg {
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  need_human?: boolean;
  context_docs?: { title: string; score: number }[];
}

function ChatTab() {
  const [messages, setMessages] = useState<DisplayMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await csApi.chat(question, sessionId);
      const data: CSReply = res.data;
      setSessionId(data.session_id);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          confidence: data.confidence,
          need_human: data.need_human,
          context_docs: data.context_docs,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，回复生成失败' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
            模拟买家提问，测试 AI 客服回复效果
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '8px 14px',
                borderRadius: 12,
                background: msg.role === 'user' ? '#1890ff' : '#f5f5f5',
                color: msg.role === 'user' ? '#fff' : '#333',
              }}
            >
              <div>{msg.content}</div>
              {msg.role === 'assistant' && msg.confidence !== undefined && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#999' }}>
                  <Space size={4}>
                    <span>置信度: {(msg.confidence * 100).toFixed(0)}%</span>
                    {msg.need_human && <Tag color="orange">需人工介入</Tag>}
                    {msg.context_docs && msg.context_docs.length > 0 && (
                      <span>参考: {msg.context_docs.map((d) => d.title).join(', ')}</span>
                    )}
                  </Space>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <Spin size="small" />
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder="输入买家问题..."
            disabled={loading}
          />
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleSend}>
            发送
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
}

function KnowledgeTab() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form] = Form.useForm();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await csApi.listKnowledge();
      setItems(res.data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await csApi.createKnowledge(values);
      message.success('知识条目已添加');
      setAddOpen(false);
      form.resetFields();
      fetchItems();
    } catch {
      // ignore
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await csApi.syncKnowledge();
      message.success(`已同步 ${res.data.synced} 条商品知识，索引共 ${res.data.total_in_index} 条`);
      fetchItems();
    } catch {
      message.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button icon={<SyncOutlined />} loading={syncing} onClick={handleSync}>
            一键同步商品库
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(!addOpen)}>
          添加知识
        </Button>
      </div>

      {addOpen && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical" initialValues={{ category: 'general' }}>
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input placeholder="如：退换货政策" />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Select options={[
                { value: 'general', label: '通用' },
                { value: 'faq', label: 'FAQ' },
                { value: 'policy', label: '政策' },
                { value: 'product', label: '商品' },
              ]} />
            </Form.Item>
            <Form.Item name="content" label="内容" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="知识内容" />
            </Form.Item>
            <Button type="primary" onClick={handleAdd}>保存</Button>
          </Form>
        </Card>
      )}

      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: '暂无知识条目' }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  {item.title}
                  <Tag>{item.category}</Tag>
                  <Tag color={item.source === 'product' ? 'blue' : 'green'}>{item.source}</Tag>
                </Space>
              }
              description={item.content.length > 100 ? item.content.slice(0, 100) + '...' : item.content}
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default function CustomerServicePage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          <MessageOutlined style={{ marginRight: 8 }} />
          客服 Agent
        </h2>
        <p style={{ color: '#666', margin: '4px 0 0' }}>
          基于 RAG 知识库的智能客服，自动回复买家咨询
        </p>
      </div>

      <Tabs
        defaultActiveKey="chat"
        items={[
          {
            key: 'chat',
            label: (
              <span>
                <MessageOutlined /> 对话测试
              </span>
            ),
            children: <ChatTab />,
          },
          {
            key: 'knowledge',
            label: (
              <span>
                <BookOutlined /> 知识库管理
              </span>
            ),
            children: <KnowledgeTab />,
          },
        ]}
      />
    </div>
  );
}
