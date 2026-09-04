import { useState } from 'react';
import { Card, Button, Form, Select, Input, message, Typography, Tag, List, Descriptions, Collapse, Empty } from 'antd';
import { PlayCircleOutlined, RiseOutlined, FallOutlined, MinusOutlined, WarningOutlined } from '@ant-design/icons';
import { agentApi } from '@/services/agent';

const { Title, Paragraph, Text } = Typography;

interface TrendItem {
  name?: string;
  trend?: string;
  heat?: number;
  description?: string;
  [key: string]: unknown;
}

interface AnalysisResult {
  raw_analysis?: string;
  [key: string]: unknown;
}

interface TrendOutput {
  category?: string;
  time_range?: string;
  dimension?: string;
  target_audience?: string;
  analysis?: AnalysisResult;
}

const trendDirectionIcon = (direction?: string) => {
  if (!direction) return null;
  const d = direction.toLowerCase();
  if (d.includes('升') || d.includes('rising') || d.includes('up')) return <RiseOutlined style={{ color: '#52c41a' }} />;
  if (d.includes('降') || d.includes('falling') || d.includes('down')) return <FallOutlined style={{ color: '#ff4d4f' }} />;
  return <MinusOutlined style={{ color: '#999' }} />;
};

const heatColor = (heat?: number) => {
  if (!heat) return '#999';
  if (heat >= 8) return '#ff4d4f';
  if (heat >= 5) return '#faad14';
  return '#52c41a';
};

const findArrayField = (obj: Record<string, unknown>, keywords: string[]): unknown[] | null => {
  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      const val = obj[key];
      if (Array.isArray(val)) return val;
    }
  }
  return null;
};

const str = (v: unknown): string | undefined => (typeof v === 'string' && v) || undefined;

const renderGenericField = (obj: Record<string, unknown>, excludeKeys: Set<string>) => {
  const entries = Object.entries(obj).filter(([k]) => !excludeKeys.has(k));
  if (entries.length === 0) return null;
  return (
    <Collapse
      style={{ marginTop: 16 }}
      items={entries.map(([key, val]) => ({
        key,
        label: <Text strong>{key}</Text>,
        children: typeof val === 'string' ? <Paragraph>{val}</Paragraph> : <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(val, null, 2)}</pre>,
      }))}
    />
  );
};

export default function TrendAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrendOutput | null>(null);

  const handleRun = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const { data } = await agentApi.run('trend', values);
      message.success(`趋势分析完成，任务ID: ${data.task_id}`);
      if (data.output_data) {
        setResult(data.output_data as TrendOutput);
      }
    } catch {
      message.error('启动失败');
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.analysis;
  const rawAnalysis = analysis?.raw_analysis;
  const isStructured = analysis && !rawAnalysis;

  const trendItems = isStructured ? findArrayField(analysis as Record<string, unknown>, ['trend', '热点', '热门', 'top']) : null;
  const styleItems = isStructured ? findArrayField(analysis as Record<string, unknown>, ['风格', 'style', 'recommend']) : null;
  const fabricItems = isStructured ? findArrayField(analysis as Record<string, unknown>, ['面料', 'fabric', '色彩', 'color']) : null;
  const productItems = isStructured ? findArrayField(analysis as Record<string, unknown>, ['选款', 'product', 'selection', '建议']) : null;
  const riskItems = isStructured ? findArrayField(analysis as Record<string, unknown>, ['风险', 'risk', '警告', 'warning', 'avoid']) : null;

  const renderedKeys = new Set<string>();
  [trendItems, styleItems, fabricItems, productItems, riskItems].forEach((arr) => {
    if (arr) {
      const entry = (analysis as Record<string, unknown>);
      for (const k of Object.keys(entry)) {
        if (Array.isArray(entry[k]) && entry[k] === arr) {
          renderedKeys.add(k);
          break;
        }
      }
    }
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3}>趋势分析 Agent</Title>
      <Paragraph type="secondary">
        监控全网服装热点、风格趋势，输出趋势报告和选款建议
      </Paragraph>

      <Card title="运行参数" style={{ marginBottom: 24 }}>
        <Form layout="vertical" onFinish={handleRun} initialValues={{ category: '女装', time_range: '近7天' }}>
          <Form.Item label="品类聚焦" name="category">
            <Select
              options={[
                { value: '女装', label: '女装' },
                { value: '男装', label: '男装' },
                { value: '童装', label: '童装' },
                { value: '运动装', label: '运动装' },
                { value: '全品类', label: '全品类' },
              ]}
            />
          </Form.Item>
          <Form.Item label="时间范围" name="time_range">
            <Select
              options={[
                { value: '近7天', label: '近7天' },
                { value: '近30天', label: '近30天' },
                { value: '近90天', label: '近90天' },
              ]}
            />
          </Form.Item>
          <Form.Item label="目标客群" name="target_audience">
            <Input placeholder="如：18-35岁女性" />
          </Form.Item>
          <Form.Item label="分析维度" name="dimension">
            <Input placeholder="如：风格趋势、面料趋势、色彩趋势" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large">
              开始分析
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <>
          {result.category && (
            <Card title="分析概览" style={{ marginBottom: 16 }}>
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                {result.category && <Descriptions.Item label="品类">{result.category}</Descriptions.Item>}
                {result.time_range && <Descriptions.Item label="时间范围">{result.time_range}</Descriptions.Item>}
                {result.target_audience && <Descriptions.Item label="目标客群">{result.target_audience}</Descriptions.Item>}
                {result.dimension && <Descriptions.Item label="分析维度">{result.dimension}</Descriptions.Item>}
              </Descriptions>
            </Card>
          )}

          {rawAnalysis ? (
            <Card title="趋势分析报告" style={{ marginBottom: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{rawAnalysis}</div>
            </Card>
          ) : isStructured ? (
            <>
              {trendItems && (
                <Card title="热门趋势" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={trendItems as TrendItem[]}
                    renderItem={(item, idx) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<div style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#1890ff' }}>{idx + 1}</div>}
                          title={
                            <span>
                              {item.name || '未知趋势'}
                              {item.trend && <span style={{ marginLeft: 8 }}>{trendDirectionIcon(item.trend)}</span>}
                              {item.heat && <Tag color={heatColor(item.heat)} style={{ marginLeft: 8 }}>热度 {item.heat}/10</Tag>}
                            </span>
                          }
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {styleItems && (
                <Card title="风格推荐" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={styleItems as TrendItem[]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={str(item.name) || str(item.style) || '推荐风格'}
                          description={str(item.description) || str(item.reason)}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {fabricItems && (
                <Card title="面料与色彩趋势" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={fabricItems as TrendItem[]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={str(item.name) || str(item.fabric) || str(item.color) || ''}
                          description={str(item.description) || str(item.trend)}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {productItems && (
                <Card title="选款建议" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={productItems as TrendItem[]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={str(item.name) || str(item.product) || str(item.sku) || ''}
                          description={str(item.reason) || str(item.description)}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {riskItems && (
                <Card
                  title={
                    <span>
                      <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                      风险提示
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <List
                    dataSource={riskItems as TrendItem[]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={str(item.name) || str(item.risk) || ''}
                          description={str(item.description) || str(item.reason)}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {isStructured && renderGenericField(analysis as Record<string, unknown>, renderedKeys)}
            </>
          ) : (
            <Card style={{ marginBottom: 16 }}>
              <Empty description="暂无分析结果" />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
