import { Timeline, Empty, Typography, Tag } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { CollaborationEvent } from '@/types';

const { Text } = Typography;

const agentColors: Record<string, string> = {
  trend: 'blue',
  product: 'green',
  content: 'purple',
  data: 'orange',
  livestream: 'red',
  customer_service: 'cyan',
  styling: 'magenta',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false });
  } catch {
    return '';
  }
}

function eventIcon(eventType: string) {
  if (eventType.includes('completed')) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  if (eventType.includes('running')) return <SyncOutlined spin style={{ color: '#1890ff' }} />;
  return <ThunderboltOutlined style={{ color: '#faad14' }} />;
}

function summarize(eventType: string): string {
  const agent = eventType.split('.')[0];
  const action = eventType.split('.').slice(1).join('.') || 'event';
  const actionLabels: Record<string, string> = {
    completed: '完成任务',
    running: '开始执行',
    failed: '执行失败',
  };
  return `${agent} ${actionLabels[action] ?? action}`;
}

interface CollaborationFlowProps {
  events: CollaborationEvent[];
  collapsed?: boolean;
}

export default function CollaborationFlow({ events, collapsed = false }: CollaborationFlowProps) {
  if (collapsed) return null;

  if (events.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Empty description="暂无协作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 24px', maxHeight: 200, overflow: 'auto' }}>
      <Text strong style={{ marginBottom: 8, display: 'block' }}>
        Agent 协作动态
      </Text>
      <Timeline
        items={[...events].reverse().map((event, i) => ({
          key: i,
          dot: eventIcon(event.event_type),
          children: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={agentColors[event.source_agent] ?? 'default'} style={{ margin: 0 }}>
                {event.source_agent}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {summarize(event.event_type)}
              </Text>
              {event.target_agent && (
                <>
                  <Text type="secondary" style={{ fontSize: 12 }}>→</Text>
                  <Tag color={agentColors[event.target_agent] ?? 'default'} style={{ margin: 0 }}>
                    {event.target_agent}
                  </Tag>
                </>
              )}
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                {formatTime(event.timestamp)}
              </Text>
            </div>
          ),
        }))}
      />
    </div>
  );
}
