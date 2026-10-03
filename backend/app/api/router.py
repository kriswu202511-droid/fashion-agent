from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.agents import router as agents_router
from app.api.tasks import router as tasks_router
from app.api.workbench import router as workbench_router
from app.api.inventory import router as inventory_router
from app.api.metrics import router as metrics_router
from app.api.livestream import router as livestream_router
from app.api.customer_service import router as cs_router
from app.api.billing import router as billing_router
from app.api.settings import router as settings_router
from app.api.admin import router as admin_router
from app.api.upload import router as upload_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(agents_router, prefix="/agents", tags=["Agent"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["任务"])
api_router.include_router(workbench_router, prefix="/workbench", tags=["工作台"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["库存"])
api_router.include_router(metrics_router, prefix="/metrics", tags=["数据指标"])
api_router.include_router(livestream_router, prefix="/livestream", tags=["直播"])
api_router.include_router(cs_router, prefix="/cs", tags=["客服"])
api_router.include_router(billing_router, prefix="/billing", tags=["计费"])
api_router.include_router(settings_router, prefix="/settings", tags=["租户设置"])
api_router.include_router(admin_router, prefix="/admin", tags=["运营管理"])
api_router.include_router(upload_router, prefix="/upload", tags=["文件上传"])
