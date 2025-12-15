import uuid
from uuid import UUID

from sqlalchemy import Boolean, Index, Integer, String
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.db.types import GUID

from .enums import ModelProvider


class AIModel(Base):
    __tablename__ = "ai_models"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    model_id: Mapped[str] = mapped_column(
        String, nullable=False, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[ModelProvider] = mapped_column(
        SQLAlchemyEnum(
            ModelProvider,
            name="modelprovider",
            values_callable=lambda obj: [entry.value for entry in obj],
        ),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_ai_models_provider_active", "provider", "is_active"),
        Index("idx_ai_models_sort_order", "sort_order"),
    )
