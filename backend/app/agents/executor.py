import json
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import agent_registry
from app.core.events import Event, event_bus
from app.models.agent_result import AgentResult as AgentResultModel
from app.models.agent_task import AgentTask, TaskStatus


class AgentExecutor:
    async def execute(
        self,
        agent_name: str,
        input_data: dict[str, Any],
        user_id: str,
        db: AsyncSession,
    ) -> AgentTask:
        agent = agent_registry.get(agent_name)
        if agent is None:
            raise ValueError(f"Agent '{agent_name}' 不存在")

        task = AgentTask(
            id=str(uuid.uuid4()),
            user_id=user_id,
            agent_name=agent_name,
            status=TaskStatus.PENDING,
            input_data=json.dumps(input_data, ensure_ascii=False),
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        return await self._run_task(agent, task, db)

    async def _run_task(self, agent: BaseAgent, task: AgentTask, db: AsyncSession) -> AgentTask:
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        await db.commit()

        try:
            await agent._before_run()
            result = await agent.run(json.loads(task.input_data))
            await agent._after_run(result.success)

            if result.success:
                task.status = TaskStatus.COMPLETED
                task.output_data = json.dumps(result.data, ensure_ascii=False)
                task.progress = 100.0

                agent_result = AgentResultModel(
                    id=str(uuid.uuid4()),
                    task_id=task.id,
                    agent_name=task.agent_name,
                    result_type="output",
                    content=json.dumps(result.data, ensure_ascii=False),
                )
                db.add(agent_result)

                await event_bus.publish(Event(
                    source_agent=task.agent_name,
                    event_type=f"{task.agent_name}.completed",
                    data=result.data,
                ))
            else:
                task.status = TaskStatus.FAILED
                task.error_message = result.error

        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            await agent._after_run(False)

        task.completed_at = datetime.now()
        await db.commit()
        await db.refresh(task)
        return task


agent_executor = AgentExecutor()
