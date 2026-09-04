import { useState, useEffect } from 'react';
import { Modal, Steps, Button, Typography, Space } from 'antd';
import {
  FireOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
  DesktopOutlined,
  BarChartOutlined,
  MessageOutlined,
  SkinOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const ONBOARDING_KEY = 'onboarding_completed';

interface AgentStep {
  name: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
  tip: string;
}

const agentSteps: AgentStep[] = [
  {
    name: 'trend',
    icon: <FireOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />,
    title: '趋势洞察 Agent',
    description: '自动抓取全网时尚趋势数据，分析热门款式、面料、色彩流行趋势，生成可执行的选品建议。',
    route: '/agents/trend',
    tip: '点击左侧「趋势洞察」即可查看最新趋势报告',
  },
  {
    name: 'product',
    icon: <ShoppingOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: '智能选品 Agent',
    description: '基于趋势数据和历史销售数据，智能推荐高潜力商品，辅助制定采购和上新计划。',
    route: '/agents/product',
    tip: '选品结果可一键导入商品库',
  },
  {
    name: 'content',
    icon: <VideoCameraOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    title: '内容创作 Agent',
    description: '自动生成商品标题、详情页文案、短视频脚本、直播话术，支持多平台风格适配。',
    route: '/agents/content',
    tip: '支持短视频脚本生成和视频制作',
  },
  {
    name: 'data',
    icon: <BarChartOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
    title: '数据分析 Agent',
    description: '全方位分析店铺运营数据：销售趋势、转化漏斗、客户画像、ROI 分析，可视化图表呈现。',
    route: '/agents/data',
    tip: '数据报表支持导出 PDF',
  },
  {
    name: 'livestream',
    icon: <DesktopOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    title: '直播助手 Agent',
    description: '实时提词面板 + AI 弹幕回复建议，帮助主播高效互动，提升直播间转化率。',
    route: '/agents/livestream',
    tip: '提词面板支持全屏模式，适合直播时使用',
  },
  {
    name: 'customer_service',
    icon: <MessageOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: '客服助手 Agent',
    description: '基于 RAG 知识库的智能客服，自动回答尺码、面料、物流等常见问题，减少人工客服压力。',
    route: '/agents/customer-service',
    tip: '可在知识库管理中添加自定义 FAQ',
  },
  {
    name: 'styling',
    icon: <SkinOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
    title: '穿搭顾问 Agent',
    description: '根据用户体型、场景、风格偏好，AI 生成个性化穿搭方案，提升客单价和复购率。',
    route: '/agents/styling',
    tip: '支持上传照片进行多模态搭配分析',
  },
];

export default function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
  };

  const handleGoAgent = () => {
    const step = agentSteps[current];
    navigate(step.route);
    handleClose();
  };

  const handleNext = () => {
    if (current < agentSteps.length - 1) {
      setCurrent(current + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const step = agentSteps[current];

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      width={640}
      footer={null}
      centered
      destroyOnClose
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          欢迎使用 AI 运营工作台
        </Title>
        <Paragraph type="secondary">
          7 个 AI Agent 组成的数字化运营团队，覆盖选品、内容、直播、客服全链路
        </Paragraph>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 0',
          minHeight: 260,
        }}
      >
        <div style={{ marginBottom: 16 }}>{step.icon}</div>
        <Title level={4} style={{ marginBottom: 8 }}>
          {step.title}
        </Title>
        <Paragraph
          style={{
            maxWidth: 480,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {step.description}
        </Paragraph>
        <div
          style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            color: '#52c41a',
          }}
        >
          💡 {step.tip}
        </div>
      </div>

      <Steps
        current={current}
        size="small"
        style={{ marginBottom: 24 }}
        items={agentSteps.map((s) => ({ title: s.name }))}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button onClick={handlePrev} disabled={current === 0}>
            上一步
          </Button>
          <Button type="primary" onClick={handleNext}>
            {current === agentSteps.length - 1 ? '开始使用' : '下一步'}
          </Button>
        </Space>
        <Button type="link" onClick={handleGoAgent}>
          直接体验 {step.title.replace(' Agent', '')}
        </Button>
      </div>
    </Modal>
  );
}
