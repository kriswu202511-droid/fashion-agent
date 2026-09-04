import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Form, Select, Input, Tabs, message, Typography, Tag, Space, Switch, Progress, Alert } from 'antd';
import { PlayCircleOutlined, CopyOutlined, VideoCameraOutlined, CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { agentApi } from '@/services/agent';
import { wsManager } from '@/services/websocket';

const { Title, Paragraph, Text } = Typography;

interface VideoResult {
  task_id?: string;
  status?: string;
  video_url?: string;
  audio_path?: string;
  message?: string;
  script?: string;
}

export default function ContentAgentPage() {
  const [activeTab, setActiveTab] = useState('short_video');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const handleVideoEvent = useCallback((data: unknown) => {
    const msg = data as Record<string, unknown>;
    if (msg?.source_agent !== 'content') return;
    const payload = msg.data as Record<string, unknown> | undefined;
    if (!payload) return;

    if (msg.type === 'content.completed') {
      const video = payload.video as VideoResult | undefined;
      if (video) {
        setVideoProgress(100);
      }
    }
  }, []);

  useEffect(() => {
    wsManager.on('*', handleVideoEvent);
    return () => { wsManager.off('*', handleVideoEvent); };
  }, [handleVideoEvent]);

  const handleRun = async (values: Record<string, string>) => {
    setLoading(true);
    setResult(null);
    setVideoProgress(null);
    try {
      const { data } = await agentApi.run('content', { content_type: activeTab, ...values });
      message.success(`内容生成任务已启动，任务ID: ${data.task_id}`);
      if (values.generate_video) {
        setVideoProgress(30);
      }
      if (data.output_data) {
        setResult(data.output_data as Record<string, unknown>);
      }
    } catch {
      message.error('生成失败');
    } finally {
      setLoading(false);
      setVideoProgress(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const renderJsonResult = (obj: unknown, depth = 0): React.ReactNode => {
    if (typeof obj === 'string') return <Paragraph>{obj}</Paragraph>;
    if (typeof obj === 'number' || typeof obj === 'boolean') return <Text>{String(obj)}</Text>;
    if (Array.isArray(obj)) {
      return (
        <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
          {obj.map((item, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              {renderJsonResult(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof obj === 'object' && obj !== null) {
      return (
        <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
          {Object.entries(obj as Record<string, unknown>).map(([key, val]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#1890ff' }}>{key}：</Text>
              <div style={{ marginTop: 4 }}>{renderJsonResult(val, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <Text>{String(obj)}</Text>;
  };

  const renderVideoResult = (video: VideoResult) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      completed: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '生成完成' },
      pending: { color: '#1890ff', icon: <LoadingOutlined spin />, label: '生成中...' },
      partial: { color: '#faad14', icon: <ClockCircleOutlined />, label: '部分完成' },
      failed: { color: '#ff4d4f', icon: <ClockCircleOutlined />, label: '生成失败' },
      config_missing: { color: '#faad14', icon: <ClockCircleOutlined />, label: '待配置' },
    };

    const cfg = statusConfig[video.status || 'pending'] || statusConfig.pending;

    return (
      <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
        <Space style={{ marginBottom: 12 }}>
          <VideoCameraOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          <Text strong>视频生成结果</Text>
          <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
        </Space>

        {video.message && (
          <Alert
            message={video.message}
            type={video.status === 'failed' ? 'error' : video.status === 'completed' ? 'success' : 'info'}
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}

        {video.status === 'completed' && video.video_url && (
          <div style={{ marginBottom: 12 }}>
            <video
              src={video.video_url}
              controls
              style={{ width: '100%', maxWidth: 640, borderRadius: 8, background: '#000' }}
            />
          </div>
        )}

        {video.audio_path && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">语音文件：</Text>
            <Text code>{video.audio_path}</Text>
          </div>
        )}
      </div>
    );
  };

  const shortVideoForm = (
    <Form layout="vertical" onFinish={handleRun} initialValues={{ platform: '抖音', style: '种草分享', duration: '30秒' }}>
      <Form.Item label="商品名称" name="product_name" rules={[{ required: true }]}>
        <Input placeholder="如：碎花雪纺连衣裙" />
      </Form.Item>
      <Form.Item label="品类" name="category">
        <Select options={[
          { value: '女装', label: '女装' },
          { value: '男装', label: '男装' },
          { value: '童装', label: '童装' },
        ]} />
      </Form.Item>
      <Form.Item label="核心卖点" name="selling_points">
        <Input.TextArea rows={2} placeholder="如：显瘦、透气、百搭" />
      </Form.Item>
      <Form.Item label="价格" name="price">
        <Input placeholder="如：¥199" />
      </Form.Item>
      <Form.Item label="发布平台" name="platform">
        <Select options={[
          { value: '抖音', label: '抖音' },
          { value: '小红书', label: '小红书' },
          { value: '快手', label: '快手' },
          { value: '视频号', label: '视频号' },
        ]} />
      </Form.Item>
      <Form.Item label="视频风格" name="style">
        <Select options={[
          { value: '种草分享', label: '种草分享' },
          { value: '穿搭教程', label: '穿搭教程' },
          { value: '开箱测评', label: '开箱测评' },
          { value: '情景剧', label: '情景剧' },
        ]} />
      </Form.Item>
      <Form.Item label="视频时长" name="duration">
        <Select options={[
          { value: '15秒', label: '15秒' },
          { value: '30秒', label: '30秒' },
          { value: '60秒', label: '60秒' },
        ]} />
      </Form.Item>
      <Form.Item label="目标受众" name="target_audience">
        <Input placeholder="如：18-30岁女性" />
      </Form.Item>
      <Form.Item label="同时生成视频" name="generate_video" valuePropName="checked">
        <Switch checkedChildren="开" unCheckedChildren="关" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large">
          生成脚本
        </Button>
      </Form.Item>
    </Form>
  );

  const livestreamForm = (
    <Form layout="vertical" onFinish={handleRun} initialValues={{ platform: '抖音', host_style: '活泼亲切', duration: '2小时' }}>
      <Form.Item label="直播主题" name="theme" rules={[{ required: true }]}>
        <Input placeholder="如：夏季新款上新专场" />
      </Form.Item>
      <Form.Item label="主推商品" name="products">
        <Input.TextArea rows={2} placeholder="如：碎花连衣裙、T恤、阔腿裤" />
      </Form.Item>
      <Form.Item label="直播时长" name="duration">
        <Select options={[
          { value: '1小时', label: '1小时' },
          { value: '2小时', label: '2小时' },
          { value: '3小时', label: '3小时' },
          { value: '4小时', label: '4小时' },
        ]} />
      </Form.Item>
      <Form.Item label="优惠策略" name="promotion">
        <Input placeholder="如：满199减30，前50名送赠品" />
      </Form.Item>
      <Form.Item label="平台" name="platform">
        <Select options={[
          { value: '抖音', label: '抖音' },
          { value: '淘宝', label: '淘宝' },
          { value: '快手', label: '快手' },
          { value: '拼多多', label: '拼多多' },
        ]} />
      </Form.Item>
      <Form.Item label="主播风格" name="host_style">
        <Select options={[
          { value: '活泼亲切', label: '活泼亲切' },
          { value: '专业知性', label: '专业知性' },
          { value: '幽默搞笑', label: '幽默搞笑' },
          { value: '高端大气', label: '高端大气' },
        ]} />
      </Form.Item>
      <Form.Item label="直播目标" name="goal">
        <Input placeholder="如：目标GMV 5万，提升粉丝粘性" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large">
          生成话术
        </Button>
      </Form.Item>
    </Form>
  );

  const copywritingForm = (
    <Form layout="vertical" onFinish={handleRun} initialValues={{ platform: '淘宝', style: '简约高级' }}>
      <Form.Item label="商品名称" name="product_name" rules={[{ required: true }]}>
        <Input placeholder="如：法式碎花连衣裙" />
      </Form.Item>
      <Form.Item label="品类" name="category">
        <Select options={[
          { value: '女装', label: '女装' },
          { value: '男装', label: '男装' },
          { value: '童装', label: '童装' },
        ]} />
      </Form.Item>
      <Form.Item label="核心卖点" name="selling_points">
        <Input.TextArea rows={2} placeholder="如：法国面料、显瘦版型、手工刺绣" />
      </Form.Item>
      <Form.Item label="价格" name="price">
        <Input placeholder="如：¥299" />
      </Form.Item>
      <Form.Item label="目标客群" name="target_audience">
        <Input placeholder="如：25-40岁都市女性" />
      </Form.Item>
      <Form.Item label="平台" name="platform">
        <Select options={[
          { value: '淘宝', label: '淘宝' },
          { value: '京东', label: '京东' },
          { value: '拼多多', label: '拼多多' },
          { value: '小红书', label: '小红书' },
        ]} />
      </Form.Item>
      <Form.Item label="文案风格" name="style">
        <Select options={[
          { value: '简约高级', label: '简约高级' },
          { value: '甜美可爱', label: '甜美可爱' },
          { value: '复古文艺', label: '复古文艺' },
          { value: '街头潮流', label: '街头潮流' },
        ]} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large">
          生成文案
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    { key: 'short_video', label: '短视频脚本', children: shortVideoForm },
    { key: 'livestream', label: '直播话术', children: livestreamForm },
    { key: 'copywriting', label: '商品文案', children: copywritingForm },
  ];

  const video = result?.video as VideoResult | undefined;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3}>内容 Agent</Title>
      <Paragraph type="secondary">
        生成短视频脚本、直播话术、商品标题与详情文案
      </Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {videoProgress !== null && videoProgress < 100 && (
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>视频生成中...</Text>
            <Progress percent={videoProgress} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />
          </Space>
        </Card>
      )}

      {result && (
        <Card
          title={
            <Space>
              <span>生成结果</span>
              <Tag color="green">
                {activeTab === 'short_video' ? '短视频脚本' : activeTab === 'livestream' ? '直播话术' : '商品文案'}
              </Tag>
            </Space>
          }
          extra={
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
            >
              复制全部
            </Button>
          }
        >
          {renderJsonResult(result.script || result.copy || result)}

          {video && renderVideoResult(video)}
        </Card>
      )}
    </div>
  );
}
