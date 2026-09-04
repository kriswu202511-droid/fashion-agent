import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Statistic, Card } from 'antd';
import { useAgentStore } from '@/stores/agentStore';
import AgentCard from '@/components/AgentCard';
import { agentApi } from '@/services/agent';
import { message } from 'antd';

const routeMap: Record<string, string> = {
  trend: '/agents/trend',
  product: '/agents/product',
  content: '/agents/content',
  data: '/agents/data',
};

export default function WorkbenchPage() {
  const { agents, fetchAgents } = useAgentStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleRun = async (agentName: string) => {
    try {
      await agentApi.run(agentName);
      message.success(`${agentName} 任务已启动`);
      fetchAgents();
    } catch {
      message.error('启动失败，请检查登录状态');
    }
  };

  const totalRuns = agents.reduce((sum, a) => sum + (a.total_runs || 0), 0);
  const runningCount = agents.filter((a) => a.status === 'running').length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Agent 总数" value={agents.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行中" value={runningCount} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="累计运行" value={totalRuns} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="异常" value={agents.filter((a) => a.status === 'error').length} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {agents.map((agent) => (
          <Col key={agent.name} xs={24} sm={12} md={8} lg={6}>
            <div onClick={() => routeMap[agent.name] && navigate(routeMap[agent.name])} style={{ cursor: routeMap[agent.name] ? 'pointer' : 'default' }}>
              <AgentCard agent={agent} onRun={handleRun} />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
