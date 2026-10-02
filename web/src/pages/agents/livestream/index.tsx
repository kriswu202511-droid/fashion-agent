import { useState, useEffect, useCallback } from 'react';
import { Button, Form, Input, Select, Modal, List, Tag, Space, message } from 'antd';
import { PlusOutlined, PlayCircleOutlined, DesktopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { livestreamApi, type LivestreamSession } from '@/services/livestream';

const statusColors: Record<string, string> = {
  pending: 'default',
  ready: 'blue',
  live: 'red',
  ended: 'default',
};

const statusLabels: Record<string, string> = {
  pending: '准备中',
  ready: '脚本就绪',
  live: '直播中',
  ended: '已结束',
};

export default function LivestreamPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LivestreamSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await livestreamApi.listSessions();
      setSessions(res.data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      const res = await livestreamApi.createSession(values);
      message.success('直播会话已创建');
      setCreateOpen(false);
      form.resetFields();
      navigate(`/agents/livestream/prompt/${res.data.id}`);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleEnter = (session: LivestreamSession) => {
    navigate(`/agents/livestream/prompt/${session.id}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>
            <DesktopOutlined style={{ marginRight: 8 }} />
            直播 Agent
          </h2>
          <p style={{ color: '#666', margin: '4px 0 0' }}>
            AI 提词面板 + 弹幕回复建议 + 节奏控制
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建直播
        </Button>
      </div>

      <List
        loading={loading}
        dataSource={sessions}
        locale={{ emptyText: '暂无直播会话，点击右上角创建' }}
        renderItem={(session) => (
          <List.Item
            actions={[
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handleEnter(session)}
              >
                进入提词面板
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  {session.title}
                  <Tag color={statusColors[session.status] || 'default'}>
                    {statusLabels[session.status] || session.status}
                  </Tag>
                </Space>
              }
              description={`创建于 ${session.created_at ? new Date(session.created_at).toLocaleString('zh-CN') : '-'}`}
            />
          </List.Item>
        )}
      />

      <Modal
        title="新建直播会话"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="创建并进入"
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ platform: '抖音', host_style: '活泼亲切', duration: '2小时' }}>
          <Form.Item name="title" label="直播标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="如：夏季新款连衣裙上新" />
          </Form.Item>
          <Form.Item name="theme" label="直播主题">
            <Input placeholder="如：夏季新款上新" />
          </Form.Item>
          <Form.Item name="products" label="主推商品">
            <Input.TextArea rows={2} placeholder="商品列表，逗号分隔" />
          </Form.Item>
          <Form.Item name="promotion" label="优惠活动">
            <Input placeholder="如：满199减30" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="platform" label="平台" style={{ flex: 1 }}>
              <Select options={[
                { value: '抖音', label: '抖音' },
                { value: '快手', label: '快手' },
                { value: '淘宝', label: '淘宝' },
                { value: '小红书', label: '小红书' },
              ]} />
            </Form.Item>
            <Form.Item name="host_style" label="主播风格" style={{ flex: 1 }}>
              <Select options={[
                { value: '活泼亲切', label: '活泼亲切' },
                { value: '专业高端', label: '专业高端' },
                { value: '幽默搞笑', label: '幽默搞笑' },
                { value: '温柔知性', label: '温柔知性' },
              ]} />
            </Form.Item>
            <Form.Item name="duration" label="计划时长" style={{ flex: 1 }}>
              <Select options={[
                { value: '1小时', label: '1小时' },
                { value: '2小时', label: '2小时' },
                { value: '3小时', label: '3小时' },
                { value: '4小时', label: '4小时' },
              ]} />
            </Form.Item>
          </div>
          <Form.Item name="goal" label="直播目标">
            <Input placeholder="如：提升转化率，目标GMV 5万" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
