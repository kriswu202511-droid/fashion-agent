from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import engine
    from app.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.agents.registry import agent_registry
    agent_registry.discover()

    yield


app = FastAPI(
    title="服装电商 AI 运营平台",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(ws_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
