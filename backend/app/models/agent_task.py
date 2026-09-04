import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    agent_name: Mapped[str] = mapped_column(String(50), index=True)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING)
    input_data: Mapped[str] = mapped_column(Text, default="{}")
    output_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_agent_tasks_user_status", "user_id", "status"),
        Index("ix_agent_tasks_user_created", "user_id", "created_at"),
    )
