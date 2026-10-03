from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.api.ws import router as ws_router
from app.config import settings
from app.core.logging import setup_logging, get_logger


setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application...")
    logger.info(f"CORS origins: {settings.cors_origins}")
    
    from app.database import engine
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config("alembic.ini")
    try:
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed")
    except Exception as e:
        logger.warning(f"Migration failed, creating tables: {e}")
        from app.models import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    from app.core import redis_client
    await redis_client.connect()
    logger.info("Redis connected")

    from app.agents.registry import agent_registry
    agent_registry.discover()
    logger.info("Agents discovered")

    logger.info("Application startup complete")
    yield

    logger.info("Shutting down application...")
    await redis_client.disconnect()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="服装电商 AI 运营平台",
    version="0.1.0",
    lifespan=lifespan,
)

from app.core.middleware import RequestLoggingMiddleware, ErrorTrackingMiddleware

app.add_middleware(ErrorTrackingMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

from app.services.storage import UPLOAD_DIR
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
