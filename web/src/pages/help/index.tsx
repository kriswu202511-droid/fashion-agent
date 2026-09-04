import { useState } from 'react';
import { Card, Collapse, Typography, Input, Tag, Space, Empty, Row, Col } from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  FireOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
  DesktopOutlined,
  BarChartOutlined,
  MessageOutlined,
  SkinOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: '基础使用',
    question: '如何开始使用 AI 运营工作台？',
    answer: '注册登录后，左侧导航栏会展示 7 个 AI Agent。首次使用建议先完成新手引导（点击头像 → 重新引导），了解每个 Agent 的功能后再按需使用。',
  },
  {
    category: '基础使用',
    question: 'Agent 运行需要多长时间？',
    answer: '大部分 Agent 在 10-30 秒内返回结果。内容创作的视频生成、数据分析的复杂报表可能需要 1-5 分钟，任务会在后台异步执行，完成后可在工作台查看结果。',
  },
  {
    category: '基础使用',
    question: '多个 Agent 之间如何协作？',
    answer: 'Agent 之间通过工作台底部的「协作动态」面板实时展示数据流转。例如趋势 Agent 发现的热门款式可自动流转到选品 Agent 进行评估，选品结果再流转到内容 Agent 生成文案。',
  },
  {
    category: '趋势洞察',
    question: '趋势数据来源于哪些渠道？',
    answer: '趋势 Agent 综合分析了主流电商平台（淘宝、抖音、小红书）的公开数据，包括热搜关键词、爆款商品、达人穿搭等内容，每日自动更新。',
  },
  {
    category: '趋势洞察',
    question: '如何查看历史趋势报告？',
    answer: '在趋势洞察页面，点击「历史报告」标签页即可查看所有已生成的趋势报告，支持按日期筛选。',
  },
  {
    category: '内容创作',
    question: '生成的文案可以修改吗？',
    answer: '可以。生成结果展示后，您可以直接在文本框中编辑修改，也可以点击「重新生成」获取新版本。修改后的内容会自动保存。',
  },
  {
    category: '内容创作',
    question: '视频生成功能如何使用？',
    answer: '在内容创作页面的「短视频」标签下，先输入商品信息生成脚本，然后开启「同时生成视频」开关。视频生成需要 1-5 分钟，完成后可在线预览和下载。',
  },
  {
    category: '直播助手',
    question: '提词面板如何使用？',
    answer: '创建直播会话后进入提词面板，左侧展示预设话术脚本（按时间轴排列），右侧实时显示弹幕和 AI 回复建议。支持全屏模式，适合直播时在大屏上使用。',
  },
  {
    category: '直播助手',
    question: '可以接入真实的直播平台吗？',
    answer: '目前支持模拟弹幕模式，已预留抖音、快手等平台的 API 接口。如需接入真实平台，请联系客服获取对接文档。',
  },
  {
    category: '客服助手',
    question: '如何添加自定义 FAQ？',
    answer: '在客服助手页面的「知识库管理」标签下，点击「添加知识」按钮，填写问题分类、问题和答案即可。也可以点击「同步商品库」自动从商品信息中生成知识条目。',
  },
  {
    category: '客服助手',
    question: 'AI 回复不准确怎么办？',
    answer: '可以在知识库中补充更详细的信息，AI 会基于知识库内容生成回复。如果问题超出知识库范围，系统会标记为「需人工介入」，建议转接人工客服处理。',
  },
  {
    category: '穿搭顾问',
    question: '穿搭建议的准确性如何保证？',
    answer: '穿搭顾问基于千问 VL 多模态模型，结合时尚搭配规则和商品库数据生成建议。上传清晰的照片、详细描述场景和体型信息可以获得更精准的推荐。',
  },
  {
    category: '计费相关',
    question: '免费版有哪些限制？',
    answer: '免费版（基础版）每月可使用 100 次 Agent 调用，包含趋势洞察、选品、内容创作三个核心 Agent。升级专业版可解锁全部 7 个 Agent 和无限调用次数。',
  },
  {
    category: '计费相关',
    question: '如何升级套餐？',
    answer: '在左侧导航栏点击「订阅计费」，查看当前套餐和可升级选项。选择目标套餐后按提示完成支付即可立即生效。',
  },
];

const agentDocs = [
  { name: '趋势洞察', icon: <FireOutlined />, desc: '全网时尚趋势分析，热门款式/面料/色彩洞察', route: '/agents/trend' },
  { name: '智能选品', icon: <ShoppingOutlined />, desc: '基于趋势+销售数据的智能选品推荐', route: '/agents/product' },
  { name: '内容创作', icon: <VideoCameraOutlined />, desc: '商品文案、短视频脚本、直播话术自动生成', route: '/agents/content' },
  { name: '数据分析', icon: <BarChartOutlined />, desc: '销售趋势、转化漏斗、客户画像可视化', route: '/agents/data' },
  { name: '直播助手', icon: <DesktopOutlined />, desc: '实时提词面板 + AI 弹幕回复建议', route: '/agents/livestream' },
  { name: '客服助手', icon: <MessageOutlined />, desc: 'RAG 知识库驱动的智能客服', route: '/agents/customer-service' },
  { name: '穿搭顾问', icon: <SkinOutlined />, desc: '多模态个性化穿搭方案推荐', route: '/agents/styling' },
];

const categories = [...new Set(faqData.map((f) => f.category))];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredFAQ = faqData.filter((item) => {
    const matchSearch =
      !search ||
      item.question.includes(search) ||
      item.answer.includes(search);
    const matchCategory = !activeCategory || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>
          <QuestionCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          帮助中心
        </Title>
        <Paragraph type="secondary">
          查找使用指南、常见问题和 Agent 功能说明
        </Paragraph>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索问题或关键词..."
          size="large"
          style={{ maxWidth: 480, marginTop: 8 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <Card title="Agent 功能速览" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {agentDocs.map((agent) => (
            <Col key={agent.name} xs={24} sm={12} md={8}>
              <div
                style={{
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  height: '100%',
                }}
              >
                <Space style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 20, color: '#1890ff' }}>{agent.icon}</span>
                  <Text strong>{agent.name}</Text>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                  {agent.desc}
                </Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="常见问题" style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Tag
            color={!activeCategory ? 'blue' : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </Tag>
          {categories.map((cat) => (
            <Tag
              key={cat}
              color={activeCategory === cat ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              {cat}
            </Tag>
          ))}
        </Space>

        {filteredFAQ.length > 0 ? (
          <Collapse accordion>
            {filteredFAQ.map((item, idx) => (
              <Panel header={item.question} key={idx}>
                <Paragraph style={{ marginBottom: 0 }}>{item.answer}</Paragraph>
                <Tag style={{ marginTop: 8 }}>{item.category}</Tag>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Empty description="没有找到匹配的问题" />
        )}
      </Card>

      <Card title="使用流程">
        <Collapse>
          <Panel header="新手入门：从趋势到出单" key="1">
            <Paragraph>
              <Text strong>第一步：</Text>使用「趋势洞察 Agent」了解当前市场热门趋势
            </Paragraph>
            <Paragraph>
              <Text strong>第二步：</Text>将趋势洞察结果传递给「智能选品 Agent」，获取选品建议
            </Paragraph>
            <Paragraph>
              <Text strong>第三步：</Text>用「内容创作 Agent」为选中的商品生成文案和视频
            </Paragraph>
            <Paragraph>
              <Text strong>第四步：</Text>在「直播助手」中使用生成的话术进行直播带货
            </Paragraph>
            <Paragraph>
              <Text strong>第五步：</Text>通过「数据分析 Agent」复盘运营效果，持续优化
            </Paragraph>
          </Panel>
          <Panel header="直播全流程" key="2">
            <Paragraph>
              <Text strong>1. 创建直播会话：</Text>在直播助手页面点击「新建直播」，填写直播标题和商品信息
            </Paragraph>
            <Paragraph>
              <Text strong>2. 进入提词面板：</Text>系统自动生成直播脚本，按时间轴展示话术
            </Paragraph>
            <Paragraph>
              <Text strong>3. 实时互动：</Text>右侧面板显示弹幕和 AI 回复建议，支持手动输入弹幕（模拟模式）
            </Paragraph>
            <Paragraph>
              <Text strong>4. 结束复盘：</Text>直播结束后在数据分析页面查看直播效果数据
            </Paragraph>
          </Panel>
          <Panel header="知识库管理" key="3">
            <Paragraph>
              <Text strong>自动同步：</Text>在客服助手的「知识库管理」中点击「同步商品库」，自动从商品信息生成 FAQ
            </Paragraph>
            <Paragraph>
              <Text strong>手动添加：</Text>点击「添加知识」，填写分类、问题和答案，适合补充退换货政策、物流说明等通用知识
            </Paragraph>
            <Paragraph>
              <Text strong>效果优化：</Text>知识库内容越丰富，AI 客服回复越准确。建议定期更新商品信息相关的知识条目
            </Paragraph>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
}
