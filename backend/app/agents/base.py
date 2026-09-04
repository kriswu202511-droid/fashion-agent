import uuid
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from datetime import datetime
from enum import Enum
from typing import Any


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"


class AgentResult:
    def __init__(self, success: bool, data: dict[str, Any] | None = None, error: str | None = None):
        self.success = success
        self.data = data or {}
        self.error = error
        self.task_id = str(uuid.uuid4())
        self.created_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "task_id": self.task_id,
            "created_at": self.created_at.isoformat(),
        }


class BaseAgent(ABC):
    name: str = ""
    description: str = ""
    version: str = "0.1.0"
    icon: str = ""

    def __init__(self):
        self._status = AgentStatus.IDLE
        self._last_run_at: datetime | None = None
        self._total_runs: int = 0

    @property
    def status(self) -> AgentStatus:
        return self._status

    @abstractmethod
    async def run(self, input_data: dict[str, Any]) -> AgentResult:
        """执行 Agent 任务，返回结果"""
        ...

    async def stream(self, input_data: dict[str, Any]) -> AsyncGenerator[dict[str, Any], None]:
        """流式执行（可选实现），用于直播等实时场景"""
        result = await self.run(input_data)
        yield result.to_dict()

    def get_info(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "icon": self.icon,
            "status": self._status.value,
            "last_run_at": self._last_run_at.isoformat() if self._last_run_at else None,
            "total_runs": self._total_runs,
        }

    async def _before_run(self):
        self._status = AgentStatus.RUNNING
        self._last_run_at = datetime.now()
        self._total_runs += 1

    async def _after_run(self, success: bool):
        self._status = AgentStatus.IDLE if success else AgentStatus.ERROR
