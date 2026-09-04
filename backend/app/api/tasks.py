import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.agent_task import AgentTask
from app.models.user import User
from app.schemas.common import PaginatedResponse, TaskResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[TaskResponse])
async def list_tasks(
    page: int = 1,
    page_size: int = 20,
    agent_name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(AgentTask).where(AgentTask.user_id == current_user.id)
    count_query = select(func.count()).select_from(AgentTask).where(AgentTask.user_id == current_user.id)

    if agent_name:
        query = query.where(AgentTask.agent_name == agent_name)
        count_query = count_query.where(AgentTask.agent_name == agent_name)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(AgentTask.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tasks = result.scalars().all()

    items = []
    for t in tasks:
        items.append(TaskResponse(
            id=t.id,
            agent_name=t.agent_name,
            status=t.status.value,
            progress=t.progress,
            input_data=json.loads(t.input_data) if t.input_data else {},
            output_data=json.loads(t.output_data) if t.output_data else None,
            error_message=t.error_message,
            created_at=t.created_at,
            started_at=t.started_at,
            completed_at=t.completed_at,
        ))

    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AgentTask).where(AgentTask.id == task_id, AgentTask.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    return TaskResponse(
        id=task.id,
        agent_name=task.agent_name,
        status=task.status.value,
        progress=task.progress,
        input_data=json.loads(task.input_data) if task.input_data else {},
        output_data=json.loads(task.output_data) if task.output_data else None,
        error_message=task.error_message,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
    )
