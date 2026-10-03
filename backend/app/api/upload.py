from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.storage import upload_image, MAX_FILE_SIZE

router = APIRouter()


@router.post("/image")
async def upload_image_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"文件过大，最大允许 {MAX_FILE_SIZE // 1024 // 1024}MB")

    try:
        url = await upload_image(current_user.id, file.filename, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": url, "filename": file.filename}
