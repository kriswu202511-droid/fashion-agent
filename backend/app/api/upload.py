from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.user import User
from app.services.storage import upload_image, MAX_FILE_SIZE

router = APIRouter()
logger = get_logger(__name__)


@router.post("/image")
async def upload_image_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        logger.warning("Upload failed: missing filename")
        raise HTTPException(status_code=400, detail="缺少文件名")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        logger.warning(f"Upload failed: file too large ({len(data)} bytes)")
        raise HTTPException(status_code=413, detail=f"文件过大，最大允许 {MAX_FILE_SIZE // 1024 // 1024}MB")

    try:
        url = await upload_image(current_user.id, file.filename, data)
        logger.info(f"File uploaded successfully: {file.filename} by user {current_user.username}")
    except ValueError as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": url, "filename": file.filename}
