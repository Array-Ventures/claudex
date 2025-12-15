import logging
import math
import uuid
from calendar import monthrange
from datetime import datetime, timedelta, timezone
from typing import cast
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import (
    RecurrenceType,
    ScheduledTask,
    TaskExecution,
    TaskExecutionStatus,
    TaskStatus,
    User,
)
from app.models.schemas import (
    PaginatedTaskExecutions,
    PaginationParams,
    ScheduledTaskBase,
    ScheduledTaskUpdate,
    TaskExecutionResponse,
    TaskToggleResponse,
)
from app.services.base import BaseDbService, SessionFactoryType
from app.services.exceptions import SchedulerException

logger = logging.getLogger(__name__)

MAX_TASKS_PER_USER = 10


def _calculate_daily_execution(
    from_time: datetime, hour: int, minute: int, second: int
) -> datetime:
    next_date = from_time.date()
    next_dt = datetime(
        next_date.year,
        next_date.month,
        next_date.day,
        hour,
        minute,
        second,
        tzinfo=timezone.utc,
    )
    if next_dt <= from_time:
        next_date = next_date + timedelta(days=1)
        next_dt = datetime(
            next_date.year,
            next_date.month,
            next_date.day,
            hour,
            minute,
            second,
            tzinfo=timezone.utc,
        )
    return next_dt


def calculate_next_datetime(
    recurrence_type: RecurrenceType,
    scheduled_time: str,
    scheduled_day: int | None,
    from_time: datetime,
    allow_once: bool = False,
) -> datetime | None:
    # Calculates the next execution time for recurring tasks, handling edge cases:
    # - WEEKLY: Uses modulo arithmetic to find days until target weekday. If target is
    #   today but time has passed, schedules for next week (days_ahead = 7).
    # - MONTHLY: Handles months with fewer days (e.g., scheduling for the 31st in February
    #   will use the 28th/29th). If target day passed this month, rolls to next month.
    time_parts = scheduled_time.split(":")
    hour = int(time_parts[0])
    minute = int(time_parts[1])
    second = int(time_parts[2]) if len(time_parts) == 3 else 0

    if recurrence_type == RecurrenceType.ONCE:
        if not allow_once:
            return None
        return _calculate_daily_execution(from_time, hour, minute, second)

    elif recurrence_type == RecurrenceType.DAILY:
        return _calculate_daily_execution(from_time, hour, minute, second)

    elif recurrence_type == RecurrenceType.WEEKLY:
        if scheduled_day is None or scheduled_day < 0 or scheduled_day > 6:
            raise SchedulerException("Weekly tasks require scheduled_day (0-6)")

        target_weekday = scheduled_day
        current_date = from_time.date()
        current_weekday = current_date.weekday()

        # Modulo arithmetic: (target - current) % 7 gives days until target weekday
        days_ahead = (target_weekday - current_weekday) % 7

        if days_ahead == 0:
            # Target weekday is today - check if scheduled time has already passed
            test_dt = datetime(
                current_date.year,
                current_date.month,
                current_date.day,
                hour,
                minute,
                second,
                tzinfo=timezone.utc,
            )
            if test_dt <= from_time:
                days_ahead = 7

        next_date = current_date + timedelta(days=days_ahead)
        next_dt = datetime(
            next_date.year,
            next_date.month,
            next_date.day,
            hour,
            minute,
            second,
            tzinfo=timezone.utc,
        )

        return next_dt

    elif recurrence_type == RecurrenceType.MONTHLY:
        if scheduled_day is None or scheduled_day < 1 or scheduled_day > 31:
            raise SchedulerException("Monthly tasks require scheduled_day (1-31)")

        target_day = scheduled_day
        current_date = from_time.date()

        year = current_date.year
        month = current_date.month
        # Clamp to month's actual last day (e.g., 31st -> 28th in Feb)
        max_day = monthrange(year, month)[1]
        day = min(target_day, max_day)

        test_dt = datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)

        if test_dt <= from_time:
            # Target day/time passed this month - roll to next month
            if month == 12:
                month = 1
                year += 1
            else:
                month += 1

            max_day = monthrange(year, month)[1]
            day = min(target_day, max_day)

        next_dt = datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)

        return next_dt

    raise SchedulerException(f"Unexpected recurrence type: {recurrence_type}")


def calculate_next_execution(
    task: ScheduledTask, from_time: datetime | None = None
) -> datetime | None:
    if from_time is None:
        from_time = datetime.now(timezone.utc)

    return calculate_next_datetime(
        task.recurrence_type,
        task.scheduled_time,
        task.scheduled_day,
        from_time,
        allow_once=False,
    )


def calculate_initial_next_execution(
    recurrence_type: RecurrenceType,
    scheduled_time: str,
    scheduled_day: int | None = None,
) -> datetime:
    now = datetime.now(timezone.utc)

    result = calculate_next_datetime(
        recurrence_type, scheduled_time, scheduled_day, now, allow_once=True
    )

    if result is None:
        raise SchedulerException(
            f"Could not calculate next execution for {recurrence_type}"
        )

    return result


def validate_recurrence_constraints(
    recurrence_type: RecurrenceType, scheduled_day: int | None
) -> None:
    if recurrence_type == RecurrenceType.WEEKLY:
        if scheduled_day is None or not (0 <= scheduled_day <= 6):
            raise SchedulerException(
                "Weekly tasks require scheduled_day between 0 (Monday) and 6 (Sunday)"
            )
    elif recurrence_type == RecurrenceType.MONTHLY:
        if scheduled_day is None or not (1 <= scheduled_day <= 31):
            raise SchedulerException(
                "Monthly tasks require scheduled_day between 1 and 31"
            )


def _format_weekly(task: ScheduledTask) -> str:
    days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    day_name = (
        days[task.scheduled_day]
        if task.scheduled_day is not None and 0 <= task.scheduled_day <= 6
        else "Unknown"
    )
    return f"Weekly on {day_name} at {task.scheduled_time}"


def _format_monthly(task: ScheduledTask) -> str:
    suffix = "th"
    if task.scheduled_day in [1, 21, 31]:
        suffix = "st"
    elif task.scheduled_day in [2, 22]:
        suffix = "nd"
    elif task.scheduled_day in [3, 23]:
        suffix = "rd"
    return f"Monthly on the {task.scheduled_day}{suffix} at {task.scheduled_time}"


def format_recurrence_description(task: ScheduledTask) -> str:
    if task.recurrence_type == RecurrenceType.ONCE:
        return f"Once at {task.scheduled_time}"
    elif task.recurrence_type == RecurrenceType.DAILY:
        return f"Daily at {task.scheduled_time}"
    elif task.recurrence_type == RecurrenceType.WEEKLY:
        return _format_weekly(task)
    elif task.recurrence_type == RecurrenceType.MONTHLY:
        return _format_monthly(task)
    raise SchedulerException(f"Unexpected recurrence type: {task.recurrence_type}")


class SchedulerService(BaseDbService[ScheduledTask]):
    def __init__(self, session_factory: SessionFactoryType | None = None) -> None:
        super().__init__(session_factory)

    async def _validate_task_limit(
        self,
        user_id: UUID,
        db: AsyncSession,
        exclude_task_id: UUID | None = None,
    ) -> bool:
        query = select(func.count(ScheduledTask.id)).where(
            ScheduledTask.user_id == user_id,
            ScheduledTask.enabled,
            ScheduledTask.status.in_([TaskStatus.ACTIVE, TaskStatus.PENDING]),
        )

        if exclude_task_id:
            query = query.where(ScheduledTask.id != exclude_task_id)

        result = await db.execute(query)
        count = result.scalar() or 0

        return count < MAX_TASKS_PER_USER

    async def _get_user_task(
        self, task_id: UUID, user_id: UUID, db: AsyncSession
    ) -> ScheduledTask | None:
        query = select(ScheduledTask).where(
            ScheduledTask.id == task_id,
            ScheduledTask.user_id == user_id,
        )
        result = await db.execute(query)
        return cast(ScheduledTask | None, result.scalar_one_or_none())

    async def _enable_task(
        self,
        task: ScheduledTask,
        user_id: UUID,
        db: AsyncSession,
        recurrence_changed: bool = False,
        time_changed: bool = False,
        day_changed: bool = False,
        skip_validation: bool = False,
    ) -> None:
        if not skip_validation:
            validate_recurrence_constraints(task.recurrence_type, task.scheduled_day)

            can_enable = await self._validate_task_limit(
                user_id, db, exclude_task_id=task.id
            )
            if not can_enable:
                raise SchedulerException(
                    "Maximum number of active tasks (10) reached. "
                    "Please disable another task first."
                )

        task.enabled = True
        task.status = TaskStatus.ACTIVE
        task.last_error = None

        if (
            task.next_execution is None
            or recurrence_changed
            or time_changed
            or day_changed
        ):
            task.next_execution = calculate_initial_next_execution(
                task.recurrence_type,
                task.scheduled_time,
                task.scheduled_day,
            )

    async def create_task(
        self, user_id: UUID, task_data: ScheduledTaskBase, db: AsyncSession
    ) -> ScheduledTask:
        can_create = await self._validate_task_limit(user_id, db)
        if not can_create:
            raise SchedulerException(
                "Maximum number of active tasks (10) reached. "
                "Please delete or disable an existing task."
            )

        validate_recurrence_constraints(
            task_data.recurrence_type, task_data.scheduled_day
        )

        next_execution = calculate_initial_next_execution(
            task_data.recurrence_type,
            task_data.scheduled_time,
            task_data.scheduled_day,
        )

        task = ScheduledTask(
            user_id=user_id,
            task_name=task_data.task_name,
            prompt_message=task_data.prompt_message,
            recurrence_type=task_data.recurrence_type,
            scheduled_time=task_data.scheduled_time,
            scheduled_day=task_data.scheduled_day,
            next_execution=next_execution,
            model_id=task_data.model_id,
            permission_mode="auto",
            thinking_mode="ultra",
            status=TaskStatus.ACTIVE,
            enabled=True,
        )

        db.add(task)
        await db.commit()
        await db.refresh(task)

        return task

    async def get_tasks(self, user_id: UUID, db: AsyncSession) -> list[ScheduledTask]:
        query = (
            select(ScheduledTask)
            .where(ScheduledTask.user_id == user_id)
            .order_by(ScheduledTask.next_execution.asc().nulls_last())
        )

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_task(
        self, task_id: UUID, user_id: UUID, db: AsyncSession
    ) -> ScheduledTask:
        task = await self._get_user_task(task_id, user_id, db)
        if not task:
            raise SchedulerException("Scheduled task not found")
        return task

    async def update_task(
        self,
        task_id: UUID,
        user_id: UUID,
        task_update: ScheduledTaskUpdate,
        db: AsyncSession,
    ) -> ScheduledTask:
        task = await self._get_user_task(task_id, user_id, db)
        if not task:
            raise SchedulerException("Scheduled task not found")

        update_data = task_update.model_dump(exclude_unset=True)

        recurrence_changed = False
        time_changed = False
        day_changed = False

        enabled_sentinel = object()
        enabled_value = update_data.pop("enabled", enabled_sentinel)

        for field, value in update_data.items():
            if field == "recurrence_type":
                recurrence_changed = True
            elif field == "scheduled_time":
                time_changed = True
            elif field == "scheduled_day":
                day_changed = True

            setattr(task, field, value)

        if recurrence_changed or time_changed or day_changed:
            validate_recurrence_constraints(task.recurrence_type, task.scheduled_day)
            task.next_execution = calculate_initial_next_execution(
                task.recurrence_type,
                task.scheduled_time,
                task.scheduled_day,
            )

        if enabled_value is not enabled_sentinel:
            if not isinstance(enabled_value, bool):
                raise SchedulerException("enabled must be a boolean value")

            if enabled_value:
                await self._enable_task(
                    task,
                    user_id,
                    db,
                    recurrence_changed=recurrence_changed,
                    time_changed=time_changed,
                    day_changed=day_changed,
                    skip_validation=task.enabled,
                )
            else:
                task.enabled = False
                task.status = TaskStatus.PAUSED

        db.add(task)
        await db.commit()
        await db.refresh(task)

        return task

    async def delete_task(self, task_id: UUID, user_id: UUID, db: AsyncSession) -> None:
        task = await self._get_user_task(task_id, user_id, db)
        if not task:
            raise SchedulerException("Scheduled task not found")

        await db.delete(task)
        await db.commit()

    async def toggle_task(
        self, task_id: UUID, user_id: UUID, db: AsyncSession
    ) -> TaskToggleResponse:
        task = await self._get_user_task(task_id, user_id, db)
        if not task:
            raise SchedulerException("Scheduled task not found")

        was_enabled = task.enabled

        if not was_enabled:
            await self._enable_task(
                task,
                user_id,
                db,
                recurrence_changed=True,
                time_changed=True,
                day_changed=True,
            )
        else:
            task.enabled = False
            task.status = TaskStatus.PAUSED

        db.add(task)
        await db.commit()
        await db.refresh(task)

        return TaskToggleResponse(
            id=task.id,
            enabled=task.enabled,
            message=f"Task {'enabled' if task.enabled else 'disabled'} successfully",
        )

    async def get_execution_history(
        self,
        task_id: UUID,
        user_id: UUID,
        pagination: PaginationParams,
        db: AsyncSession,
    ) -> PaginatedTaskExecutions:
        task = await self._get_user_task(task_id, user_id, db)
        if not task:
            raise SchedulerException("Scheduled task not found")

        count_query = select(func.count(TaskExecution.id)).where(
            TaskExecution.task_id == task_id
        )
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        offset = (pagination.page - 1) * pagination.per_page
        query = (
            select(TaskExecution)
            .where(TaskExecution.task_id == task_id)
            .order_by(TaskExecution.executed_at.desc())
            .offset(offset)
            .limit(pagination.per_page)
        )

        result = await db.execute(query)
        executions = result.scalars().all()

        return PaginatedTaskExecutions(
            items=[TaskExecutionResponse.model_validate(e) for e in executions],
            page=pagination.page,
            per_page=pagination.per_page,
            total=total,
            pages=math.ceil(total / pagination.per_page) if total > 0 else 0,
        )


async def check_duplicate_execution(
    db: AsyncSession, task_uuid: uuid.UUID, start_time: datetime
) -> bool:
    existing_exec = await db.execute(
        select(TaskExecution).where(
            TaskExecution.task_id == task_uuid,
            TaskExecution.executed_at >= start_time - timedelta(minutes=2),
            TaskExecution.status.in_(
                [TaskExecutionStatus.RUNNING, TaskExecutionStatus.SUCCESS]
            ),
        )
    )
    return existing_exec.scalar_one_or_none() is not None


async def load_task_and_user(
    db: AsyncSession, task_uuid: uuid.UUID
) -> tuple[ScheduledTask | None, User | None]:
    query = select(ScheduledTask).where(ScheduledTask.id == task_uuid)
    result = await db.execute(query)
    scheduled_task = result.scalar_one_or_none()

    if not scheduled_task:
        return None, None

    user_query = select(User).where(User.id == scheduled_task.user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()

    return scheduled_task, user


async def complete_task_execution(
    db: AsyncSession,
    execution_id: uuid.UUID,
    status: TaskExecutionStatus,
    error_message: str | None = None,
) -> None:
    exec_query = select(TaskExecution).where(TaskExecution.id == execution_id)
    exec_result = await db.execute(exec_query)
    execution = exec_result.scalar_one_or_none()

    if execution:
        execution.status = status
        execution.completed_at = datetime.now(timezone.utc)
        execution.duration_ms = int(
            (execution.completed_at - execution.executed_at).total_seconds() * 1000
        )
        if error_message:
            execution.error_message = error_message
        db.add(execution)


async def update_task_after_execution(
    db: AsyncSession,
    task_uuid: uuid.UUID,
    start_time: datetime,
    success: bool,
    error_message: str | None = None,
) -> None:
    task_query = select(ScheduledTask).where(ScheduledTask.id == task_uuid)
    task_result = await db.execute(task_query)
    scheduled_task = task_result.scalar_one_or_none()

    if not scheduled_task:
        return

    if success:
        scheduled_task.execution_count += 1
        scheduled_task.last_execution = start_time
        scheduled_task.last_error = None
    else:
        scheduled_task.failure_count += 1
        scheduled_task.last_error = error_message

    next_exec = calculate_next_execution(scheduled_task, from_time=start_time)

    if next_exec is None:
        scheduled_task.enabled = False
        scheduled_task.status = TaskStatus.COMPLETED
        scheduled_task.next_execution = None
    else:
        scheduled_task.next_execution = next_exec

    db.add(scheduled_task)
