import { Card, Tag, Badge } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  onRun?: (name: string) => void;
}

const statusColor: Record<string, string> = {
  idle: 'default',
  running: 'processing',
  error: 'error',
};

export default function AgentCard({ agent, onRun }: AgentCardProps) {
  return (
    <Card
      hoverable
      style={{ width: 280 }}
      actions={[
        <span key="run" onClick={() => onRun?.(agent.name)}>
          <PlayCircleOutlined /> 运行
        </span>,
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{agent.name}</span>
            <Badge status={statusColor[agent.status] as 'default' | 'processing' | 'error'} />
          </div>
        }
        description={agent.description}
      />
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Tag>v{agent.version}</Tag>
        <Tag>运行 {agent.total_runs} 次</Tag>
      </div>
    </Card>
  );
}
