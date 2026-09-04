# Phase 4-5 执行计划

> 基于产品规划书，Phase 1-3 已完成，本文档覆盖剩余开发步骤。

## 当前已完成

- Phase 1：项目骨架、用户系统、Agent 框架、千问 API、库存管理、UI 框架
- Phase 2：4 个 Agent（趋势/选品/内容文案/数据）、Web 工作台
- Phase 3：WebSocket、直播 Agent + 提词面板、客服 Agent + RAG、视频管线（API 版）、小程序骨架

---

## Phase 4：完善 + 上线

### 4.1 穿搭顾问 Agent
- `backend/app/agents/styling/agent.py` — 多模态搭配推荐
- `backend/app/agents/styling/prompts.py` — 搭配 Prompt
- `web/src/pages/agents/styling/index.tsx` — 前端页面
- 路由 + 侧边栏注册
- 输入：场景/风格/体型/照片 → 输出：搭配方案

### 4.2 Agent 协作消息流
- 工作台底部新增实时消息流面板
- 展示 Agent 间数据流转（趋势→选品→内容）
- WebSocket EventBus 驱动

### 4.3 数据可视化（ECharts）
- 集成 echarts + echarts-for-react
- 转化漏斗图、GMV 趋势图、品类占比饼图
- 数据 Agent 输出结构化数据 → 前端渲染图表

### 4.4 视频管线完善
- 视频服务升级为可配置模式（API / 自部署）
- 前端视频播放器 + 进度展示

### 4.5 性能优化
- Redis 缓存、LLM 限流
- 前端路由懒加载
- 数据库索引优化

### 4.6 Docker 部署
- 后端/前端 Dockerfile
- .env.example 模板
- docker-compose up 一键启动

---

## Phase 5：商业化

### 5.1 计费系统
- 套餐模型 + 用量记录
- API 配额拦截中间件
- 前端套餐管理页面

### 5.2 多租户
- 数据隔离（user_id 过滤）
- 租户级配置
- 注册流程

### 5.3 运营看板
- 管理员统计面板
- 用户数/调用量/收入/健康度

### 5.4 用户引导
- 新手引导组件
- 帮助文档 + FAQ

---

## 验收标准

1. 7 个 Agent 全部可用（趋势/选品/内容/直播/数据/客服/穿搭）
2. Agent 协作消息流可见
3. 数据 Agent 有 ECharts 图表
4. 视频管线可触发并展示结果
5. 小程序 5 页面可导航
6. 计费系统：套餐 + 用量 + 配额
7. 多租户数据隔离
8. 运营看板面板
9. Docker 一键部署
10. TypeScript 零错误，后端无 import 报错

---

## 需要你提前准备的

| 序号 | 项目 | 说明 | 紧急度 |
|------|------|------|--------|
| 1 | DashScope API Key | 千问 LLM/TTS/Embedding 的核心依赖，没有它 AI 功能全部无法运行 | 必须 |
| 2 | 微信小程序 AppID | 小程序上线必须，开发阶段可用测试号 | 可后补 |
| 3 | GPU 方案 | 视频生成用 API（通义万相/可灵）还是自部署 MiniMax H3？ | 可后补 |
| 4 | 部署目标 | 先本地 Docker 还是直接配阿里云 ECS？ | 可后补 |
| 5 | 第三方数据源 | 趋势 Agent 用蝉妈妈/飞瓜 API 还是模拟数据？ | 可后补 |

**只需要你提供 #1（DashScope API Key）即可开始全部开发工作，其余可在开发过程中逐步补充。**
