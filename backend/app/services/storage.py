import os
import uuid
import asyncio
from pathlib import Path

import oss2

from app.config import settings

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def _is_oss_configured() -> bool:
    return bool(settings.oss_access_key_id and settings.oss_bucket_name and settings.oss_endpoint)


def _get_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"不支持的文件格式: {ext}，仅支持 {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    return ext


def _build_object_key(user_id: str, filename: str) -> str:
    ext = _get_extension(filename)
    unique = uuid.uuid4().hex
    return f"{user_id}/{unique}{ext}"


async def upload_image(user_id: str, filename: str, data: bytes) -> str:
    if len(data) > MAX_FILE_SIZE:
        raise ValueError(f"文件过大，最大允许 {MAX_FILE_SIZE // 1024 // 1024}MB")

    object_key = _build_object_key(user_id, filename)

    if _is_oss_configured():
        return await asyncio.to_thread(_upload_to_oss, object_key, data)
    return await asyncio.to_thread(_upload_to_local, object_key, data)


def _upload_to_oss(object_key: str, data: bytes) -> str:
    auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
    bucket = oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket_name)
    oss_key = f"uploads/{object_key}"
    bucket.put_object(oss_key, data, headers={"Content-Type": "image/jpeg"})

    if settings.oss_cdn_domain:
        return f"https://{settings.oss_cdn_domain}/{oss_key}"
    return f"https://{settings.oss_bucket_name}.{settings.oss_endpoint.replace('https://', '')}/{oss_key}"


def _upload_to_local(object_key: str, data: bytes) -> str:
    file_path = UPLOAD_DIR / object_key
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(data)
    return f"/uploads/{object_key}"
