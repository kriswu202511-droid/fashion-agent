# 日志系统

本项目的日志系统提供结构化日志和错误追踪功能。

## 特性

- **结构化日志**: 生产环境使用 JSON 格式，便于日志收集和分析
- **请求追踪**: 每个请求分配唯一 ID，支持全链路追踪
- **错误追踪**: 自动捕获和记录未处理的异常
- **上下文日志**: 支持添加用户 ID、请求 ID 等上下文信息
- **环境适配**: 开发环境使用可读格式，生产环境使用 JSON 格式

## 使用方式

### 基本用法

```python
from app.core.logging import get_logger

logger = get_logger(__name__)

logger.info("这是一条信息日志")
logger.warning("这是一条警告日志")
logger.error("这是一条错误日志")
```

### 带上下文的日志

```python
logger.info(
    "用户登录成功",
    extra={
        "user_id": user.id,
        "username": user.username,
        "ip_address": request.client.host,
    }
)
```

### 上下文日志适配器

```python
from app.core.logging import get_context_logger

logger = get_context_logger(__name__, user_id=user.id, tenant_id=tenant.id)

logger.info("执行操作")  # 自动包含 user_id 和 tenant_id
```

### 异常日志

```python
try:
    # 可能抛出异常的代码
    result = await some_operation()
except Exception as e:
    logger.error(
        f"操作失败: {e}",
        extra={"error_type": type(e).__name__},
        exc_info=True  # 包含堆栈信息
    )
```

## 中间件

### RequestLoggingMiddleware

自动记录所有 HTTP 请求：
- 请求方法、路径、查询参数
- 客户端 IP、User-Agent
- 响应状态码、处理时间
- 请求 ID (X-Request-ID)

### ErrorTrackingMiddleware

自动捕获和记录未处理的异常：
- 异常类型和消息
- 完整的堆栈追踪
- 请求上下文信息

## 日志格式

### 开发环境

```
2026-10-03 10:30:15,123 [INFO] app.api.auth: User logged in successfully: testuser (id: 123)
```

### 生产环境 (JSON)

```json
{
  "timestamp": "2026-10-03 10:30:15",
  "level": "INFO",
  "logger": "app.api.auth",
  "message": "User logged in successfully: testuser (id: 123)",
  "module": "auth",
  "function": "login",
  "line": 75,
  "request_id": "abc-123-def",
  "user_id": "123"
}
```

## 配置

日志配置在 `app/core/logging.py` 中，根据 `APP_ENV` 环境变量自动调整：

- `development`: 标准格式，DEBUG 级别
- `production`: JSON 格式，INFO 级别

## 最佳实践

1. **使用适当的日志级别**:
   - DEBUG: 详细的调试信息
   - INFO: 正常的操作记录
   - WARNING: 警告但不会影响系统运行
   - ERROR: 错误但系统仍可继续运行
   - CRITICAL: 严重错误，系统可能无法继续运行

2. **包含上下文信息**:
   ```python
   logger.info(
       "创建商品成功",
       extra={
           "product_id": product.id,
           "product_name": product.name,
           "user_id": current_user.id,
       }
   )
   ```

3. **记录异常时使用 exc_info**:
   ```python
   logger.error("操作失败", exc_info=True)
   ```

4. **避免记录敏感信息**:
   - 不要记录密码、token 等敏感数据
   - 注意脱敏用户个人信息

5. **使用结构化数据**:
   ```python
   # 好的做法
   logger.info("操作完成", extra={"duration_ms": 123, "items_count": 10})
   
   # 不好的做法
   logger.info(f"操作完成，耗时 123ms，处理 10 项")
   ```

## 日志收集

生产环境建议将 JSON 日志收集到：
- ELK Stack (Elasticsearch + Logstash + Kibana)
-阿里云日志服务 (SLS)
- CloudWatch Logs
- Graylog

## 示例

查看以下文件获取完整示例：
- `app/api/auth.py` - 认证日志
- `app/api/upload.py` - 上传日志
- `app/main.py` - 应用启动日志
