import { useNavigate } from 'react-router-dom';
import { Badge, Tooltip } from 'antd';
import {
  FireOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  BarChartOutlined,
  MessageOutlined,
  SkinOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  PayCircleOutlined,
  SettingOutlined,
  DashboardOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useAgentStore } from '@/stores/agentStore';
import { useAuthStore } from '@/stores/authStore';
import type { Agent } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  FireOutlined: <FireOutlined />,
  ShoppingOutlined: <ShoppingOutlined />,
  VideoCameraOutlined: <VideoCameraOutlined />,
  SoundOutlined: <SoundOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  MessageOutlined: <MessageOutlined />,
  SkinOutlined: <SkinOutlined />,
  LiveOutlined: <DesktopOutlined />,
};

const routeMap: Record<string, string> = {
  trend: '/agents/trend',
  product: '/agents/product',
  content: '/agents/content',
  data: '/agents/data',
  livestream: '/agents/livestream',
  customer_service: '/agents/customer-service',
  styling: '/agents/styling',
};

const labelMap: Record<string, string> = {
  trend: '趋势洞察',
  product: '智能选品',
  content: '内容创作',
  data: '数据分析',
  livestream: '直播助手',
  customer_service: '客服助手',
  styling: '穿搭顾问',
};

const statusMap: Record<string, 'default' | 'processing' | 'error'> = {
  idle: 'default',
  running: 'processing',
  error: 'error',
};

export default function AgentSidebar() {
  const { agents, selectedAgent, selectAgent } = useAgentStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleClick = (agent: Agent) => {
    selectAgent(agent.name);
    const route = routeMap[agent.name];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div
      style={{
        width: 200,
        background: '#001529',
        height: '100%',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          padding: '0 16px 16px',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 8,
        }}
      >
        AI 运营团队
      </div>

      {agents.map((agent: Agent) => (
        <Tooltip key={agent.name} title={agent.description} placement="right">
          <div
            onClick={() => handleClick(agent)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              cursor: 'pointer',
              color: selectedAgent === agent.name ? '#fff' : 'rgba(255,255,255,0.65)',
              background: selectedAgent === agent.name ? '#1890ff' : 'transparent',
              borderRadius: 6,
              margin: '0 8px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 18 }}>{iconMap[agent.icon] || <FireOutlined />}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{labelMap[agent.name] || agent.name}</span>
            <Badge status={statusMap[agent.status] || 'default'} />
          </div>
        </Tooltip>
      ))}

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: '0 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 8,
        }}
      >
        <Tooltip title="库存管理" placement="right">
          <div
            onClick={() => navigate('/inventory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              transition: 'all 0.2s',
            }}
          >
            <DatabaseOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14 }}>库存管理</span>
          </div>
        </Tooltip>
        <Tooltip title="订阅计费" placement="right">
          <div
            onClick={() => navigate('/billing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              transition: 'all 0.2s',
            }}
          >
            <PayCircleOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14 }}>订阅计费</span>
          </div>
        </Tooltip>
        <Tooltip title="设置" placement="right">
          <div
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              transition: 'all 0.2s',
            }}
          >
            <SettingOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14 }}>设置</span>
          </div>
        </Tooltip>
        <Tooltip title="帮助中心" placement="right">
          <div
            onClick={() => navigate('/help')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              transition: 'all 0.2s',
            }}
          >
            <QuestionCircleOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14 }}>帮助中心</span>
          </div>
        </Tooltip>
        {user?.role === 'admin' && (
          <Tooltip title="运营看板" placement="right">
            <div
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.65)',
                transition: 'all 0.2s',
              }}
            >
              <DashboardOutlined style={{ fontSize: 18 }} />
              <span style={{ fontSize: 14 }}>运营看板</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
