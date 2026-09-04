import { useState } from 'react';
import { Card, Button, Form, Select, Input, InputNumber, message, Typography, List, Tag, Rate } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { agentApi } from '@/services/agent';

const { Title, Paragraph, Text } = Typography;

interface Recommendation {
  sku: string;
  name: string;
  reason: string;
  priority: number;
  expected_margin: string;
  suggested_price: number;
  risk: string;
  trend_match: string;
}

interface SelectionResult {
  strategy: string;
  recommendations: Recommendation[];
  summary: string;
}

export default function ProductAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SelectionResult | null>(null);

  const handleRun = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data } = await agentApi.run('product', values);
      message.success(`选品任务已启动，任务ID: ${data.task_id}`);
      if (data.output_data?.selection) {
        setResult(data.output_data.selection as SelectionResult);
      }
    } catch {
      message.error('启动失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3}>选品 Agent</Title>
      <Paragraph type="secondary">
        结合库存数据、趋势分析和市场洞察，推荐最优选品方案
      </Paragraph>

      <Card title="选品参数" style={{ marginBottom: 24 }}>
        <Form
          layout="vertical"
          onFinish={handleRun}
          initialValues={{ category: '全品类', target_margin: 30, budget: '不限' }}
        >
          <Form.Item label="品类聚焦" name="category">
            <Select
              options={[
                { value: '全品类', label: '全品类' },
                { value: '女装', label: '女装' },
                { value: '男装', label: '男装' },
                { value: '童装', label: '童装' },
                { value: '运动装', label: '运动装' },
                { value: '配饰', label: '配饰' },
              ]}
            />
          </Form.Item>
          <Form.Item label="目标利润率（%）" name="target_margin">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="预算范围" name="budget">
            <Select
              options={[
                { value: '不限', label: '不限' },
                { value: '5000以内', label: '5000以内' },
                { value: '5000-20000', label: '5000-20000' },
                { value: '20000-50000', label: '20000-50000' },
                { value: '50000以上', label: '50000以上' },
              ]}
            />
          </Form.Item>
          <Form.Item label="目标客群" name="target_audience">
            <Input placeholder="如：18-35岁女性，追求性价比" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large">
              开始选品分析
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <>
          <Card title="选品策略" style={{ marginBottom: 16 }}>
            <Paragraph>{result.strategy}</Paragraph>
          </Card>

          <Card title="推荐清单" style={{ marginBottom: 16 }}>
            <List
              dataSource={result.recommendations || []}
              renderItem={(item: Recommendation) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span>
                        {item.name} <Tag color="blue">{item.sku}</Tag>
                        <Rate disabled value={item.priority / 2} style={{ marginLeft: 8, fontSize: 14 }} />
                        <Text type="secondary" style={{ marginLeft: 8 }}>优先级: {item.priority}/10</Text>
                      </span>
                    }
                    description={
                      <div>
                        <Paragraph>{item.reason}</Paragraph>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <Text>预期利润率: <Text strong>{item.expected_margin}</Text></Text>
                          <Text>建议售价: <Text strong>¥{item.suggested_price}</Text></Text>
                          <Text>趋势匹配: {item.trend_match}</Text>
                        </div>
                        {item.risk && (
                          <Paragraph type="warning" style={{ marginTop: 8 }}>
                            风险提示: {item.risk}
                          </Paragraph>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="总结">
            <Paragraph>{result.summary}</Paragraph>
          </Card>
        </>
      )}
    </div>
  );
}
