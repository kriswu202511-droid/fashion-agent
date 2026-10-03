"""Tests for file upload API"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_image_success(client: AsyncClient, test_user):
    """Test successful image upload"""
    # Create a fake image file
    fake_image = b"fake-jpeg-data" * 100
    
    response = await client.post(
        "/api/upload/image",
        files={"file": ("test.jpg", fake_image, "image/jpeg")},
        headers=test_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "filename" in data
    assert data["filename"] == "test.jpg"
    assert "/uploads/" in data["url"]


@pytest.mark.asyncio
async def test_upload_image_unauthorized(client: AsyncClient):
    """Test upload without authentication fails"""
    fake_image = b"fake-jpeg-data"
    
    response = await client.post(
        "/api/upload/image",
        files={"file": ("test.jpg", fake_image, "image/jpeg")},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_invalid_extension(client: AsyncClient, test_user):
    """Test upload with invalid file extension fails"""
    fake_file = b"fake-data"
    
    response = await client.post(
        "/api/upload/image",
        files={"file": ("test.txt", fake_file, "text/plain")},
        headers=test_user["headers"],
    )
    assert response.status_code == 400
    assert "不支持的文件格式" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_oversized_file(client: AsyncClient, test_user):
    """Test upload with oversized file fails"""
    # Create a file larger than 10MB
    large_file = b"x" * (11 * 1024 * 1024)
    
    response = await client.post(
        "/api/upload/image",
        files={"file": ("large.jpg", large_file, "image/jpeg")},
        headers=test_user["headers"],
    )
    assert response.status_code == 413


@pytest.mark.asyncio
async def test_upload_png_image(client: AsyncClient, test_user):
    """Test uploading PNG image"""
    fake_png = b"fake-png-data" * 100
    
    response = await client.post(
        "/api/upload/image",
        files={"file": ("test.png", fake_png, "image/png")},
        headers=test_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.png"
    assert ".png" in data["url"]


@pytest.mark.asyncio
async def test_upload_webp_image(client: AsyncClient, test_user):
    """Test uploading WebP image"""
    fake_webp = b"fake-webp-data" * 100
    
    response = await client.post(
        "/api/upload/image",
        files={"file": ("test.webp", fake_webp, "image/webp")},
        headers=test_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.webp"
