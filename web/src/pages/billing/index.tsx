import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Progress, Row, Statistic, Table, Tag, message } from 'antd';
import { CrownOutlined, RocketOutlined, StarOutlined } from '@ant-design/icons';
import api from '@/services/api';

interface Subscription {
  plan: string;
  status: string;
  agent_quota: number;
  agents_used: number;
  available_agents: string[];
  expires_at: string | null;
}

interface Plan {
  id: string;
  name: string;
  quota: number;
  agents: string[];
}

interface UsageData {
  daily: { date: string; calls: number; tokens: number; cost: number }[];
  by_agent: Record<string, number>;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <StarOutlined />,
  starter: <RocketOutlined />,
  pro: <CrownOutlined />,
};

const planColors: Record<string, string> = {
  free: 'default',
  starter: 'blue',
  pro: 'gold',
};

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/billing/subscription'),
      api.get('/billing/plans'),
      api.get('/billing/usage?days=7'),
    ]).then(([subRes, plansRes, usageRes]) => {
      setSub(subRes.data);
      setPlans(plansRes.data);
      setUsage(usageRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    try {
      await api.post(`/billing/subscription/upgrade?plan=${plan}`);
      message.success('套餐已升级');
      const res = await api.get('/billing/subscription');
      setSub(res.data);
    } catch {
      message.error('升级失败');
    }
  };

  if (loading) return null;

  const usagePercent = sub ? Math.round((sub.agents_used / sub.agent_quota) * 100) : 0;

  const agentColumns = [
    { title: 'Agent', dataIndex: 'agent', key: 'agent' },
    { title: '调用次数', dataIndex: 'calls', key: 'calls', sorter: (a: any, b: any) => a.calls - b.calls },
  ];

  const agentData = usage?.by_agent
    ? Object.entries(usage.by_agent).map(([agent, calls]) => ({ key: agent, agent, calls }))
    : [];

  const dailyColumns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '调用次数', dataIndex: 'calls', key: 'calls' },
    { title: 'Token 用量', dataIndex: 'tokens', key: 'tokens', render: (v: number) => v.toLocaleString() },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>订阅与计费</h2>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="当前套餐">
            {sub && (
              <>
                <Descriptions column={2}>
                  <Descriptions.Item label="套餐">
                    <Tag color={planColors[sub.plan]}>{sub.plan === 'free' ? '免费版' : sub.plan === 'starter' ? '入门版' : '专业版'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={sub.status === 'active' ? 'green' : 'red'}>{sub.status === 'active' ? '生效中' : '已过期'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="本月用量">
                    {sub.agents_used} / {sub.agent_quota} 次
                  </Descriptions.Item>
                  <Descriptions.Item label="到期时间">
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '无限制'}
                  </Descriptions.Item>
                </Descriptions>
                <Progress percent={usagePercent} status={usagePercent > 80 ? 'exception' : 'active'} style={{ marginTop: 16 }} />
                {usagePercent > 80 && (
                  <Alert type="warning" message="用量即将耗尽，建议升级套餐" style={{ marginTop: 12 }} showIcon />
                )}
              </>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="本月总调用" value={usage?.total_calls ?? 0} />
            <Statistic title="Token 用量" value={usage?.total_tokens ?? 0} style={{ marginTop: 16 }} />
          </Card>
        </Col>
      </Row>

      <h3 style={{ marginTop: 24, marginBottom: 12 }}>套餐方案</h3>
      <Row gutter={16}>
        {plans.map((plan) => (
          <Col span={8} key={plan.id}>
            <Card
              title={
                <span>
                  {planIcons[plan.id]} {plan.name}
                </span>
              }
              style={sub?.plan === plan.id ? { borderColor: '#1890ff' } : undefined}
            >
              <p>Agent 调用配额：{plan.quota} 次/月</p>
              <p>可用 Agent：</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {plan.agents.map((a) => (
                  <Tag key={a}>{a}</Tag>
                ))}
              </div>
              {sub?.plan !== plan.id && (
                <Button
                  type="primary"
                  style={{ marginTop: 16 }}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {sub && plan.quota > sub.agent_quota ? '升级' : '切换'}
                </Button>
              )}
              {sub?.plan === plan.id && (
                <Tag color="green" style={{ marginTop: 16 }}>当前套餐</Tag>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="Agent 调用分布">
            <Table columns={agentColumns} dataSource={agentData} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="近 7 天用量">
            <Table columns={dailyColumns} dataSource={usage?.daily ?? []} pagination={false} size="small" rowKey="date" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
