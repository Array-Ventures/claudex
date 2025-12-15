from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.db_models import ModelProvider


class AIModelResponse(BaseModel):
    id: UUID
    model_id: str
    name: str
    provider: ModelProvider
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
