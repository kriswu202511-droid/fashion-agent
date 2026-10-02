import json

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import agent_registry
from app.core.dependencies import get_current_user
from app.core.quota import check_quota
from app.database import get_db
from app.models.user import User
from app.schemas.agent import AgentInfo, AgentRunRequest, AgentRunResponse
from app.agents.executor import agent_executor

router = APIRouter()


@router.get("/", response_model=list[AgentInfo])
async def list_agents():
    agents = agent_registry.list_all()
    return [AgentInfo(**agent.get_info()) for agent in agents]


@router.get("/{agent_name}", response_model=AgentInfo)
async def get_agent(agent_name: str):
    agent = agent_registry.get(agent_name)
    if not agent:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' 不存在")
    return AgentInfo(**agent.get_info())


@router.post("/run", response_model=AgentRunResponse)
async def run_agent(
    request: AgentRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_quota(request.agent_name, current_user, db)

    task = await agent_executor.execute(
        agent_name=request.agent_name,
        input_data=request.input_data,
        user_id=current_user.id,
        db=db,
    )
    output = None
    if task.output_data:
        try:
            output = json.loads(task.output_data)
        except (json.JSONDecodeError, TypeError):
            output = None

    return AgentRunResponse(
        task_id=task.id,
        agent_name=task.agent_name,
        status=task.status.value,
        output_data=output,
    )
