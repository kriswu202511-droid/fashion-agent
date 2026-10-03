"""Tests for inventory API"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, test_user):
    """Test creating a new product"""
    product_data = {
        "name": "测试商品",
        "sku": "TEST001",
        "category": "上衣",
        "price": 199.99,
        "stock": 100,
        "description": "这是一个测试商品",
    }
    response = await client.post(
        "/api/inventory/products",
        json=product_data,
        headers=test_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "测试商品"
    assert data["sku"] == "TEST001"
    assert data["price"] == 199.99


@pytest.mark.asyncio
async def test_list_products(client: AsyncClient, test_user):
    """Test listing products with pagination"""
    # Create a product first
    product_data = {
        "name": "商品A",
        "sku": "SKU001",
        "category": "裤子",
        "price": 99.99,
        "stock": 50,
    }
    await client.post("/api/inventory/products", json=product_data, headers=test_user["headers"])
    
    # List products
    response = await client.get("/api/inventory/products", headers=test_user["headers"])
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_update_product(client: AsyncClient, test_user):
    """Test updating a product"""
    # Create a product
    product_data = {
        "name": "商品C",
        "sku": "SKU003",
        "category": "裙子",
        "price": 149.99,
        "stock": 40,
    }
    create_response = await client.post(
        "/api/inventory/products",
        json=product_data,
        headers=test_user["headers"],
    )
    product_id = create_response.json()["id"]
    
    # Update the product
    update_data = {"price": 129.99}
    response = await client.put(
        f"/api/inventory/products/{product_id}",
        json=update_data,
        headers=test_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == 129.99


@pytest.mark.asyncio
async def test_delete_product(client: AsyncClient, test_user):
    """Test deleting a product"""
    # Create a product
    product_data = {
        "name": "商品D",
        "sku": "SKU004",
        "category": "鞋子",
        "price": 399.99,
        "stock": 20,
    }
    create_response = await client.post(
        "/api/inventory/products",
        json=product_data,
        headers=test_user["headers"],
    )
    product_id = create_response.json()["id"]
    
    # Delete the product
    response = await client.delete(
        f"/api/inventory/products/{product_id}",
        headers=test_user["headers"],
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test that unauthenticated requests are rejected"""
    response = await client.get("/api/inventory/products")
    assert response.status_code == 401
