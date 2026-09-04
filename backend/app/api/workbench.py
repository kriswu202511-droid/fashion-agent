from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.core.events import event_bus
from app.agents.registry import agent_registry
from app.models.user import User

router = APIRouter()


@router.get("/overview")
async def get_overview(current_user: User = Depends(get_current_user)):
    agents = agent_registry.list_all()
    return {
        "total_agents": len(agents),
        "agents": [a.get_info() for a in agents],
        "collaboration_history": [
            {
                "source_agent": e.source_agent,
                "event_type": e.event_type,
                "target_agent": e.target_agent,
                "data": e.data,
                "timestamp": e.timestamp,
            }
            for e in event_bus.get_history(limit=20)
        ],
    }


@router.get("/collaboration/events")
async def get_collaboration_events(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    return [
        {
            "source_agent": e.source_agent,
            "event_type": e.event_type,
            "target_agent": e.target_agent,
            "data": e.data,
            "timestamp": e.timestamp,
        }
        for e in event_bus.get_history(limit=limit)
    ]
