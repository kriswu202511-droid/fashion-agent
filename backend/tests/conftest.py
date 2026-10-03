"""Pytest configuration and fixtures"""
import asyncio
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database import get_db
from app.models import Base
from app.main import app


TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_database():
    """Create tables before each test and drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional database session for tests."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client for testing API endpoints."""
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_db] = override_get_session
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(client: AsyncClient):
    """Create a test user and return user data with token."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
    }
    
    response = await client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200
    
    login_response = await client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "testpass123",
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    return {
        "username": "testuser",
        "email": "test@example.com",
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }
