"""Tests for authentication API"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration"""
    user_data = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "securepass123",
    }
    response = await client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, test_user):
    """Test registration fails with duplicate username"""
    user_data = {
        "username": "testuser",  # Already exists from fixture
        "email": "different@example.com",
        "password": "pass123",
    }
    response = await client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400
    assert "已存在" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    """Test successful login"""
    login_data = {
        "username": "testuser",
        "password": "testpass123",
    }
    response = await client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    """Test login fails with wrong password"""
    login_data = {
        "username": "testuser",
        "password": "wrongpass",
    }
    response = await client.post("/api/auth/login", json=login_data)
    assert response.status_code == 401
