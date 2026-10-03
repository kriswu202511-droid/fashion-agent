# 安全配置指南

## CORS 配置

### 开发环境

开发环境默认允许 localhost 来源：

```env
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
CORS_CREDENTIALS=true
```

### 生产环境

生产环境**必须**限制为实际的前端域名：

```env
# 单域名
CORS_ORIGINS=["https://yourdomain.com"]

# 多域名
CORS_ORIGINS=["https://yourdomain.com", "https://admin.yourdomain.com"]

# 包含 IP（不推荐，仅用于测试）
CORS_ORIGINS=["http://47.102.219.206"]
```

### 配置说明

- `CORS_ORIGINS`: 允许的来源列表，**不要使用 `["*"]`**
- `CORS_CREDENTIALS`: 是否允许携带凭证（cookies、authorization headers）
- `CORS_METHODS`: 允许的 HTTP 方法
- `CORS_HEADERS`: 允许的请求头

### 安全建议

1. **永远不要在生产环境使用 `allow_origins=["*"]`**
2. 使用 HTTPS 保护传输安全
3. 限制 origins 到最小必要范围
4. 定期审查和更新 CORS 配置

## 其他安全配置

### 1. Secret Key

生产环境必须使用强随机密钥：

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. 数据库密码

使用强密码，不要使用默认密码。

### 3. API Keys

- 不要将 API keys 提交到代码库
- 使用环境变量或密钥管理服务
- 定期轮换 API keys

### 4. HTTPS

生产环境必须启用 HTTPS：

1. 获取 SSL 证书（Let's Encrypt 免费）
2. 配置 nginx 或 Caddy 作为反向代理
3. 强制 HTTPS 重定向

### 5. 安全头

nginx 配置已包含安全头：

- `X-Frame-Options`: 防止点击劫持
- `X-Content-Type-Options`: 防止 MIME 类型嗅探
- `X-XSS-Protection`: XSS 过滤
- `Referrer-Policy`: 控制 referrer 信息

### 6. 速率限制

建议添加速率限制防止滥用：

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

## 检查清单

部署到生产环境前，请确认：

- [ ] CORS origins 已限制为实际域名
- [ ] Secret key 已更换为强随机值
- [ ] 数据库密码已更改
- [ ] HTTPS 已启用
- [ ] API keys 未提交到代码库
- [ ] 安全头已配置
- [ ] 日志级别设置为 INFO 或 WARNING
- [ ] 调试模式已关闭

## 常见错误

### ❌ 错误：使用通配符

```python
allow_origins=["*"]  # 危险！
```

### ✅ 正确：明确指定来源

```python
allow_origins=["https://yourdomain.com"]
```

### ❌ 错误：硬编码密钥

```python
SECRET_KEY="my-secret-key"  # 危险！
```

### ✅ 正确：使用环境变量

```python
SECRET_KEY=os.getenv("SECRET_KEY")
```

## 参考

- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [MDN CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [OWASP Security Guide](https://owasp.org/www-project-web-security-testing-guide/)
