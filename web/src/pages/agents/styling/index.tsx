import { useState } from 'react';
import { Card, Button, Form, Select, Input, message, Typography, Space, Tag, Divider, Row, Col, Upload } from 'antd';
import { SkinOutlined, PlayCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
  photo_analysis?: string;
}

export default function StylingAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StylingResult | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handleImageUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片图片文件');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > height && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = compressedBase64.split(',')[1];
        setPhotoBase64(base64);
        setPhotoPreview(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleRemovePhoto = () => {
    setPhotoBase64('');
    setPhotoPreview('');
  };

  const handleRun = async (values: Record<string, string>) => {
    setLoading(true);
    setResult(null);
    try {
      const inputData = { ...values };
      if (photoBase64) {
        inputData.photo_base64 = photoBase64;
      }
      const { data } = await agentApi.run('styling', inputData);
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
        根据体型、场景、风格偏好，AI 为你推荐个性化穿搭方案。支持上传照片，AI 自动分析穿搭元素。
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
          <Form.Item label="上传穿搭照片（可选）">
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={photoPreview}
                  alt="穿搭预览"
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleRemovePhoto}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%' }}
                  size="small"
                />
              </div>
            ) : (
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleImageUpload}
              >
                <Button icon={<PlusOutlined />}>上传穿搭照片</Button>
              </Upload>
            )}
            <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
              支持 JPG/PNG/WebP 格式，最大 5MB。上传后 AI 将自动分析照片中的穿搭元素。
            </div>
          </Form.Item>

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

          <Form.Item label="补充描述（可选）" name="photo_description">
            <Input.TextArea
              rows={2}
              placeholder="对照片的补充描述，或其他穿搭需求"
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
          {result.photo_analysis && (
            <>
              <Card size="small" title="照片分析" style={{ marginBottom: 16, borderLeft: '3px solid #722ed1' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result.photo_analysis}</Paragraph>
              </Card>
              <Divider />
            </>
          )}

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
