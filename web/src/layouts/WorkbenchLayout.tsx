import { useState, useEffect, useCallback } from 'react';
import { Layout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import AgentSidebar from '@/components/AgentSidebar';
import CollaborationFlow from '@/components/CollaborationFlow';
import OnboardingGuide from '@/components/OnboardingGuide';
import { useAgentStore } from '@/stores/agentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { wsManager } from '@/services/websocket';
import api from '@/services/api';
import type { CollaborationEvent } from '@/types';

const { Sider, Content, Footer } = Layout;

interface WorkbenchLayoutProps {
  children: React.ReactNode;
}

export default function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [flowCollapsed, setFlowCollapsed] = useState(true);
  const [events, setEvents] = useState<CollaborationEvent[]>([]);
  const agents = useAgentStore((s) => s.agents);

  useWebSocket();

  useEffect(() => {
    api.get('/workbench/collaboration/events').then((res) => {
      setEvents(res.data);
    }).catch(() => {});
  }, []);

  const handleWSEvent = useCallback((data: unknown) => {
    const msg = data as Record<string, unknown>;
    if (!msg.source_agent || !msg.type) return;
    const event: CollaborationEvent = {
      source_agent: msg.source_agent as string,
      event_type: msg.type as string,
      target_agent: (msg.target_agent as string) ?? null,
      data: (msg.data as Record<string, unknown>) ?? {},
      timestamp: (msg.timestamp as string) ?? new Date().toISOString(),
    };
    setEvents((prev) => [...prev.slice(-99), event]);
  }, []);

  useEffect(() => {
    wsManager.on('*', handleWSEvent);
    return () => { wsManager.off('*', handleWSEvent); };
  }, [handleWSEvent]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ background: '#001529' }}
      >
        {!collapsed && <AgentSidebar />}
        {collapsed && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <Button
              type="text"
              icon={<MenuUnfoldOutlined style={{ color: '#fff' }} />}
              onClick={() => setCollapsed(false)}
            />
          </div>
        )}
      </Sider>

      <Layout>
        <div
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            height: 48,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 500 }}>
            服装电商 AI 运营工作台
          </span>
        </div>

        <Content style={{ margin: 16, flex: 1, overflow: 'auto' }}>{children}</Content>
        <OnboardingGuide />

        <Footer
          style={{
            padding: 0,
            background: '#fafafa',
            borderTop: '1px solid #f0f0f0',
            cursor: 'pointer',
          }}
          onClick={() => setFlowCollapsed(!flowCollapsed)}
        >
          <div
            style={{
              padding: '8px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, color: '#666' }}>
              {flowCollapsed ? '展开协作动态' : '收起协作动态'}
              {events.length > 0 && (
                <span style={{ marginLeft: 8, color: '#1890ff' }}>
                  ({events.length})
                </span>
              )}
            </span>
            <span style={{ fontSize: 12, color: '#999' }}>
              {agents.length} 个 Agent 就绪
            </span>
          </div>
          <CollaborationFlow events={events} collapsed={flowCollapsed} />
        </Footer>
      </Layout>
    </Layout>
  );
}
