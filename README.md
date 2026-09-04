# 服装电商 AI 数字运营团队

面向电商个人商家的一站式 AI 运营工具，由多个独立 Agent 组成"数字运营团队"。

## Agent 列表

| Agent | 功能 | 状态 |
|-------|------|------|
| 趋势 Agent | 监控全网服装热点，输出趋势报告 | 已实现骨架 |
| 选品 Agent | 结合库存和趋势推荐选品 | 待开发 |
| 内容 Agent | 生成短视频脚本、数字人视频 | 待开发 |
| 直播 Agent | 实时弹幕监听 + 话术提示 | 待开发 |
| 数据 Agent | 复盘转化分析，诊断问题 | 待开发 |
| 客服 Agent | 自动回复买家咨询 | 待开发 |
| 穿搭 Agent | 根据场景推荐搭配方案 | 待开发 |

## 技术栈

- **后端：** Python FastAPI + SQLAlchemy + PostgreSQL
- **前端：** React + Ant Design + Zustand
- **LLM：** 通义千问（Qwen）
- **视频生成：** MiniMax H3（开源）
- **语音合成：** CosyVoice（开源）
- **小程序：** uni-app（待开发）

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 20+
- Docker（可选，用于一键启动）

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY
```

### 2. Docker 启动（推荐）

```bash
docker-compose up -d
```

### 3. 手动启动

**后端：**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**前端：**
```bash
cd web
npm install
npm run dev
```

### 4. 访问

- API 文档：http://localhost:8000/docs
- 前端工作台：http://localhost:5173

## 项目结构

```
├── backend/          # Python FastAPI 后端
│   └── app/
│       ├── agents/   # Agent 框架 + 各 Agent 实现
│       ├── api/      # API 路由
│       ├── core/     # 核心基础设施（认证、事件总线）
│       ├── models/   # 数据库模型
│       ├── schemas/  # Pydantic 模型
│       └── services/ # 业务服务（LLM 封装等）
├── web/              # React 前端
│   └── src/
│       ├── components/  # 通用组件
│       ├── layouts/     # 布局
│       ├── pages/       # 页面
│       ├── services/    # API 调用
│       └── stores/      # 状态管理
└── miniprogram/      # 小程序（待开发）
```

## 开发新 Agent

1. 在 `backend/app/agents/` 下创建新目录
2. 创建 `agent.py`，继承 `BaseAgent` 并添加 `@register_agent` 装饰器
3. 实现 `run()` 方法
4. Agent 会自动被发现并注册到工作台
