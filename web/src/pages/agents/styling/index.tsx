import { useState } from 'react';
import { Card, Button, Form, Select, Input, message, Typography, Space, Tag, Divider, Row, Col } from 'antd';
import { SkinOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { agentApi } from '@/services/agent';

const { Title, Paragraph, Text } = Typography;

interface OutfitItem {
  name: string;
  style: string;
  items: { top: string; bottom: string; shoes: string; accessories: string };
  color_scheme: string;
  reason: string;
  tips: string;
}

interface StylingResult {
  analysis?: string;
  outfits?: OutfitItem[];
  general_tips?: string;
  raw_recommendation?: string;
}

export default function StylingAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StylingResult | null>(null);

  const handleRun = async (values: Record<string, string>) => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await agentApi.run('styling', values);
      if (data.output_data) {
        setResult(data.output_data as unknown as StylingResult);
        message.success('穿搭方案已生成');
      } else {
        message.info('任务已提交，请稍后查看结果');
      }
    } catch {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3}>
        <SkinOutlined style={{ marginRight: 8 }} />
        穿搭顾问 Agent
      </Title>
      <Paragraph type="secondary">
        根据体型、场景、风格偏好，AI 为你推荐个性化穿搭方案
      </Paragraph>

      <Card title="穿搭需求" style={{ marginBottom: 24 }}>
        <Form
          layout="vertical"
          onFinish={handleRun}
          initialValues={{
            scene: '日常通勤',
            style_preference: '简约',
            body_type: '标准',
            gender: '女',
            season: '春季',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="场景" name="scene">
                <Select
                  options={[
                    { value: '日常通勤', label: '日常通勤' },
                    { value: '约会', label: '约会' },
                    { value: '休闲逛街', label: '休闲逛街' },
                    { value: '商务会议', label: '商务会议' },
                    { value: '运动户外', label: '运动户外' },
                    { value: '正式场合', label: '正式场合' },
                    { value: '度假旅行', label: '度假旅行' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="风格偏好" name="style_preference">
                <Select
                  options={[
                    { value: '简约', label: '简约' },
                    { value: '韩系', label: '韩系' },
                    { value: '日系', label: '日系' },
                    { value: '欧美', label: '欧美' },
                    { value: '复古', label: '复古' },
                    { value: '甜美', label: '甜美' },
                    { value: '街头', label: '街头' },
                    { value: '知性', label: '知性' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="体型" name="body_type">
                <Select
                  options={[
                    { value: '偏瘦', label: '偏瘦' },
                    { value: '标准', label: '标准' },
                    { value: '微胖', label: '微胖' },
                    { value: '丰满', label: '丰满' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="性别" name="gender">
                <Select
                  options={[
                    { value: '女', label: '女' },
                    { value: '男', label: '男' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="季节" name="season">
                <Select
                  options={[
                    { value: '春季', label: '春季' },
                    { value: '夏季', label: '夏季' },
                    { value: '秋季', label: '秋季' },
                    { value: '冬季', label: '冬季' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="照片描述（可选）" name="photo_description">
            <Input.TextArea
              rows={2}
              placeholder="描述你的照片内容，如：穿着一件白色T恤和牛仔裤，在户外"
            />
          </Form.Item>

          <Form.Item label="其他需求" name="extra_notes">
            <Input.TextArea rows={2} placeholder="如：预算 500 以内，偏好浅色系" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large">
              生成穿搭方案
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <Card title="推荐方案">
          {result.analysis && (
            <>
              <Paragraph>
                <Text strong>分析：</Text>{result.analysis}
              </Paragraph>
              <Divider />
            </>
          )}

          {result.raw_recommendation && !result.outfits && (
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{result.raw_recommendation}</Paragraph>
          )}

          {result.outfits && result.outfits.length > 0 && (
            <Row gutter={[16, 16]}>
              {result.outfits.map((outfit, idx) => (
                <Col span={24} key={idx}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span>方案 {idx + 1}：{outfit.name}</span>
                        <Tag color="blue">{outfit.style}</Tag>
                      </Space>
                    }
                    style={{ borderLeft: '3px solid #1890ff' }}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div><Text type="secondary">上装：</Text>{outfit.items?.top}</div>
                          <div><Text type="secondary">下装：</Text>{outfit.items?.bottom}</div>
                          <div><Text type="secondary">鞋履：</Text>{outfit.items?.shoes}</div>
                          <div><Text type="secondary">配饰：</Text>{outfit.items?.accessories}</div>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div><Text type="secondary">色彩搭配：</Text>{outfit.color_scheme}</div>
                          <div><Text type="secondary">搭配理由：</Text>{outfit.reason}</div>
                          {outfit.tips && (
                            <div style={{ padding: '8px 12px', background: '#f6ffed', borderRadius: 6 }}>
                              <Text type="secondary">小贴士：</Text>{outfit.tips}
                            </div>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {result.general_tips && (
            <>
              <Divider />
              <Card size="small" title="通用穿搭建议" style={{ background: '#fafafa' }}>
                <Paragraph style={{ margin: 0 }}>{result.general_tips}</Paragraph>
              </Card>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
