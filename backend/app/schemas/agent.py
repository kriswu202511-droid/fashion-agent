from typing import Any

from pydantic import BaseModel


class AgentInfo(BaseModel):
    name: str
    description: str
    version: str = "0.1.0"
    status: str = "idle"
    icon: str = ""
    config_schema: dict[str, Any] = {}
    total_runs: int = 0
    last_run_at: str | None = None


class AgentRunRequest(BaseModel):
    agent_name: str
    input_data: dict[str, Any] = {}
    stream: bool = False


class AgentRunResponse(BaseModel):
    task_id: str
    agent_name: str
    status: str
    output_data: dict[str, Any] | None = None


class AgentStatusResponse(BaseModel):
    name: str
    status: str
    last_run_at: str | None = None
    total_runs: int = 0
