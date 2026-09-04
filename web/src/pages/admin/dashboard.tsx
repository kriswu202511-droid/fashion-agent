import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Badge, Spin, message } from 'antd';
import {
  TeamOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { adminApi } from '@/services/agent';
import type { AdminStats, AdminUser } from '@/services/agent';

const agentLabels: Record<string, string> = {
  trend: '趋势洞察',
  product: '智能选品',
  content: '内容创作',
  data: '数据分析',
  livestream: '直播助手',
  customer_service: '客服助手',
  styling: '穿搭顾问',
};

const planLabels: Record<string, string> = {
  free: '免费版',
  starter: '入门版',
  pro: '专业版',
};

const statusColors: Record<string, string> = {
  completed: 'green',
  running: 'blue',
  pending: 'default',
  failed: 'red',
  cancelled: 'orange',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.stats(),
        adminApi.users(page),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.items);
      setTotalUsers(usersRes.data.total);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleToggleActive = async (userId: string) => {
    try {
      await adminApi.toggleActive(userId);
      message.success('已更新');
      loadData();
    } catch {
      message.error('操作失败');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) return null;

  const healthColor = stats.system_health === 'healthy' ? 'green' : stats.system_health === 'degraded' ? 'orange' : 'red';
  const healthLabel = stats.system_health === 'healthy' ? '正常' : stats.system_health === 'degraded' ? '异常' : '故障';

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '套餐',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => <Tag color={plan === 'pro' ? 'gold' : plan === 'starter' ? 'blue' : 'default'}>{planLabels[plan] || plan}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Badge status={active ? 'success' : 'error'} text={active ? '正常' : '已禁用'} />
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t: string) => new Date(t).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AdminUser) => (
        <a onClick={() => handleToggleActive(record.id)}>
          {record.is_active ? '禁用' : '启用'}
        </a>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>运营管理看板</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total_users}
              prefix={<TeamOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>今日 +{stats.new_users_today}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.active_users}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total_tasks}
              prefix={<ThunderboltOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>今日 +{stats.tasks_today}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="系统健康"
              value={healthLabel}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: healthColor === 'green' ? '#3f8600' : healthColor === 'orange' ? '#fa8c16' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日收入" value={stats.revenue_today} precision={2} prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="累计收入" value={stats.total_revenue} precision={2} prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>套餐分布</div>
            {Object.entries(stats.subscriptions_by_plan).map(([plan, count]) => (
              <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{planLabels[plan] || plan}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
            ))}
            {Object.keys(stats.subscriptions_by_plan).length === 0 && <span style={{ color: '#999' }}>暂无数据</span>}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>任务状态</div>
            {Object.entries(stats.tasks_by_status).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Tag color={statusColors[status] || 'default'}>{status}</Tag>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
            ))}
            {Object.keys(stats.tasks_by_status).length === 0 && <span style={{ color: '#999' }}>暂无数据</span>}
          </Card>
        </Col>
      </Row>

      <Card title="Agent 调用排行" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(stats.tasks_by_agent)
            .sort((a, b) => b[1] - a[1])
            .map(([agent, count]) => (
              <Col key={agent} xs={12} sm={8} md={6} lg={4}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{count}</div>
                  <div style={{ color: '#666', marginTop: 4 }}>{agentLabels[agent] || agent}</div>
                </div>
              </Col>
            ))}
          {Object.keys(stats.tasks_by_agent).length === 0 && (
            <Col span={24}><span style={{ color: '#999' }}>暂无任务数据</span></Col>
          )}
        </Row>
      </Card>

      <Card title="用户列表" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{
            current: page,
            total: totalUsers,
            pageSize: 20,
            onChange: setPage,
            showTotal: (total) => `共 ${total} 个用户`,
          }}
        />
      </Card>
    </div>
  );
}
