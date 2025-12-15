import uuid
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.db.types import GUID

from .enums import RecurrenceType, TaskExecutionStatus, TaskStatus


class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_name: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt_message: Mapped[str] = mapped_column(Text, nullable=False)
    recurrence_type: Mapped[RecurrenceType] = mapped_column(
        SQLAlchemyEnum(
            RecurrenceType,
            name="recurrencetype",
            values_callable=lambda obj: [entry.value for entry in obj],
        ),
        nullable=False,
    )
    scheduled_time: Mapped[str] = mapped_column(String(8), nullable=False)
    scheduled_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    next_execution: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    last_execution: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[TaskStatus] = mapped_column(
        SQLAlchemyEnum(
            TaskStatus,
            name="taskstatus",
            values_callable=lambda obj: [entry.value for entry in obj],
        ),
        nullable=False,
        default=TaskStatus.ACTIVE,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    execution_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failure_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_id: Mapped[str | None] = mapped_column(String, nullable=True)
    permission_mode: Mapped[str] = mapped_column(String, default="auto", nullable=False)
    thinking_mode: Mapped[str | None] = mapped_column(String, nullable=True)

    executions = relationship(
        "TaskExecution", back_populates="task", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_scheduled_tasks_user_next", "user_id", "next_execution"),
        Index("idx_scheduled_tasks_enabled_next", "enabled", "next_execution"),
    )


class TaskExecution(Base):
    __tablename__ = "task_executions"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("scheduled_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[TaskExecutionStatus] = mapped_column(
        SQLAlchemyEnum(
            TaskExecutionStatus,
            name="taskexecutionstatus",
            values_callable=lambda obj: [entry.value for entry in obj],
        ),
        nullable=False,
    )
    chat_id: Mapped[UUID | None] = mapped_column(GUID(), nullable=True)
    message_id: Mapped[UUID | None] = mapped_column(GUID(), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    task = relationship("ScheduledTask", back_populates="executions")

    __table_args__ = (
        Index("idx_task_executions_task_created", "task_id", "created_at"),
        Index("idx_task_executions_status", "status"),
    )
