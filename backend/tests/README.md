# 测试套件

本目录包含后端服务的自动化测试。

## 运行测试

### 安装测试依赖

```bash
cd backend
pip install -r requirements.txt
```

### 运行所有测试

```bash
pytest
```

### 运行特定测试文件

```bash
pytest tests/test_auth.py
```

### 运行带覆盖率的测试

```bash
pytest --cov=app --cov-report=term-missing
```

### 运行带详细输出的测试

```bash
pytest -v
pytest -s  # 显示 print 输出
```

## 测试结构

- `conftest.py` - 共享 fixtures 和配置
- `test_auth.py` - 认证 API 测试
- `test_inventory.py` - 库存管理 API 测试
- `test_upload.py` - 文件上传 API 测试
- `test_storage.py` - 存储服务单元测试
- `test_main.py` - 主应用测试

## Fixtures

### `client`
异步 HTTP 客户端，用于测试 API 端点。

```python
async def test_example(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
```

### `test_user`
创建测试用户并返回包含 token 的用户数据。

```python
async def test_example(client: AsyncClient, test_user):
    response = await client.get(
        "/api/auth/me",
        headers=test_user["headers"]
    )
    assert response.status_code == 200
```

### `db_session`
提供事务性数据库会话。

```python
async def test_example(db_session: AsyncSession):
    # 数据库操作
```

## 测试数据库

测试使用独立的 SQLite 数据库 (`test.db`)，每个测试前后自动创建和销毁表。

## 覆盖率报告

生成 HTML 覆盖率报告：

```bash
pytest --cov=app --cov-report=html
```

然后在浏览器中打开 `htmlcov/index.html`。
