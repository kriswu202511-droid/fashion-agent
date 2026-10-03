"""Tests for storage service"""
import pytest
from pathlib import Path
from app.services.storage import (
    _build_object_key,
    _get_extension,
    _upload_to_local,
    UPLOAD_DIR,
    ALLOWED_EXTENSIONS,
)


def test_get_extension_valid():
    """Test extracting valid file extensions"""
    assert _get_extension("photo.jpg") == ".jpg"
    assert _get_extension("image.PNG") == ".png"
    assert _get_extension("picture.WEBP") == ".webp"
    assert _get_extension("photo.jpeg") == ".jpeg"
    assert _get_extension("image.gif") == ".gif"


def test_get_extension_invalid():
    """Test that invalid extensions raise ValueError"""
    with pytest.raises(ValueError, match="不支持的文件格式"):
        _get_extension("document.pdf")
    
    with pytest.raises(ValueError, match="不支持的文件格式"):
        _get_extension("script.exe")
    
    with pytest.raises(ValueError, match="不支持的文件格式"):
        _get_extension("archive.zip")


def test_build_object_key():
    """Test building object key with user ID and UUID"""
    key = _build_object_key("user123", "photo.jpg")
    
    assert key.startswith("user123/")
    assert key.endswith(".jpg")
    assert len(key) > len("user123/") + len(".jpg")
    
    # Verify UUID part (32 hex chars)
    parts = key.split("/")
    assert len(parts) == 2
    uuid_part = parts[1].replace(".jpg", "")
    assert len(uuid_part) == 32
    assert all(c in "0123456789abcdef" for c in uuid_part)


def test_build_object_key_unique():
    """Test that object keys are unique even for same user and filename"""
    key1 = _build_object_key("user123", "photo.jpg")
    key2 = _build_object_key("user123", "photo.jpg")
    
    assert key1 != key2  # Different UUIDs


@pytest.mark.asyncio
async def test_upload_to_local():
    """Test local file upload"""
    object_key = "test-user/abc123.jpg"
    data = b"test-image-data"
    
    url = _upload_to_local(object_key, data)
    
    assert url == "/uploads/test-user/abc123.jpg"
    
    # Verify file was created
    file_path = UPLOAD_DIR / object_key
    assert file_path.exists()
    assert file_path.read_bytes() == data
    
    # Cleanup
    file_path.unlink()
    file_path.parent.rmdir()


@pytest.mark.asyncio
async def test_upload_to_local_creates_directories():
    """Test that upload creates parent directories"""
    object_key = "deep/nested/path/image.jpg"
    data = b"test-data"
    
    url = _upload_to_local(object_key, data)
    
    file_path = UPLOAD_DIR / object_key
    assert file_path.exists()
    
    # Cleanup
    file_path.unlink()
    for parent in file_path.parents:
        if parent == UPLOAD_DIR:
            break
        parent.rmdir()


def test_allowed_extensions():
    """Test that allowed extensions are correct"""
    assert ".jpg" in ALLOWED_EXTENSIONS
    assert ".jpeg" in ALLOWED_EXTENSIONS
    assert ".png" in ALLOWED_EXTENSIONS
    assert ".webp" in ALLOWED_EXTENSIONS
    assert ".gif" in ALLOWED_EXTENSIONS
    assert len(ALLOWED_EXTENSIONS) == 5
