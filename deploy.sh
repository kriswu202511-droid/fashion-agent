#!/bin/bash
set -e

# 配置
ECS_IP="47.102.219.206"
ECS_USER="root"
SSH_KEY="/Users/nick/Downloads/阿里.pem"
REMOTE_DIR="/opt/fashion-agent"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

echo "=========================================="
echo "  服装电商 AI 运营平台 - ECS 部署脚本"
echo "=========================================="
echo ""
echo "目标服务器: $ECS_USER@$ECS_IP"
echo "部署目录: $REMOTE_DIR"
echo ""

# Step 1: 测试 SSH 连接
echo "[1/6] 测试 SSH 连接..."
if ! ssh $SSH_OPTS $ECS_USER@$ECS_IP "echo 'SSH 连接成功'" 2>/dev/null; then
    echo "❌ SSH 连接失败，请检查："
    echo "  - ECS 公网 IP 是否正确"
    echo "  - SSH 密钥路径: $SSH_KEY"
    echo "  - 安全组是否开放 22 端口"
    exit 1
fi
echo "✅ SSH 连接正常"
echo ""

# Step 2: 安装 Docker（如果没有）
echo "[2/6] 检查 Docker 环境..."
ssh $SSH_OPTS $ECS_USER@$ECS_IP << 'REMOTE_SETUP'
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "Docker 安装完成"
else
    echo "Docker 已安装: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "安装 Docker Compose 插件..."
    apt-get update && apt-get install -y docker-compose-plugin 2>/dev/null || \
    yum install -y docker-compose-plugin 2>/dev/null || \
    echo "请手动安装 docker-compose-plugin"
fi

docker compose version 2>/dev/null || docker-compose --version 2>/dev/null
REMOTE_SETUP
echo "✅ Docker 环境就绪"
echo ""

# Step 3: 创建远程目录
echo "[3/6] 准备远程目录..."
ssh $SSH_OPTS $ECS_USER@$ECS_IP "mkdir -p $REMOTE_DIR"
echo "✅ 远程目录: $REMOTE_DIR"
echo ""

# Step 4: 同步项目文件
echo "[4/6] 同步项目文件到 ECS..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '__pycache__' \
    --exclude '.venv' \
    --exclude 'venv' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '.pytest_cache' \
    --exclude 'data/' \
    -e "ssh $SSH_OPTS" \
    /Users/nick/Desktop/服装/ $ECS_USER@$ECS_IP:$REMOTE_DIR/
echo "✅ 文件同步完成"
echo ""

# Step 5: 构建和启动
echo "[5/6] 构建镜像并启动服务..."
ssh $SSH_OPTS $ECS_USER@$ECS_IP << REMOTE_DEPLOY
cd $REMOTE_DIR

# 停止旧容器（如果有）
docker compose down 2>/dev/null || true

# 构建镜像
echo "构建后端镜像..."
docker compose build backend

echo "构建前端镜像..."
docker compose build web

# 启动服务
echo "启动所有服务..."
docker compose up -d

# 等待服务就绪
echo "等待服务启动..."
sleep 10

# 显示状态
docker compose ps
REMOTE_DEPLOY
echo ""

# Step 6: 验证部署
echo "[6/6] 验证部署..."
sleep 5
if ssh $SSH_OPTS $ECS_USER@$ECS_IP "curl -sf http://localhost/health" 2>/dev/null | grep -q "ok"; then
    echo "✅ 健康检查通过"
else
    echo "⚠️  健康检查未通过，查看日志："
    ssh $SSH_OPTS $ECS_USER@$ECS_IP "cd $REMOTE_DIR && docker compose logs --tail=20"
fi
echo ""

echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://$ECS_IP"
echo ""
echo "常用命令："
echo "  查看日志: ssh $ECS_USER@$ECS_IP 'cd $REMOTE_DIR && docker compose logs -f'"
echo "  重启服务: ssh $ECS_USER@$ECS_IP 'cd $REMOTE_DIR && docker compose restart'"
echo "  停止服务: ssh $ECS_USER@$ECS_IP 'cd $REMOTE_DIR && docker compose down'"
echo ""
echo "⚠️  重要提醒："
echo "  1. 编辑 .env 文件填入真实的 DASHSCOPE_API_KEY"
echo "  2. 确保 ECS 安全组开放 80 端口"
echo "  3. 更新后重新运行此脚本即可重新部署"
