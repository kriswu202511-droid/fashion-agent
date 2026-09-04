import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AgentResult(Base):
    __tablename__ = "agent_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), index=True)
    agent_name: Mapped[str] = mapped_column(String(50), index=True)
    result_type: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text, default="{}")
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
