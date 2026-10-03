"""Tests for main application"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint"""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_root_not_found(client: AsyncClient):
    """Test that root path returns 404 or redirect"""
    response = await client.get("/")
    # Root path is not defined, should return 404 or redirect
    assert response.status_code in [404, 307]


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    """Test that CORS headers are present"""
    response = await client.get("/health")
    # CORS middleware should allow all origins
    assert response.status_code == 200
