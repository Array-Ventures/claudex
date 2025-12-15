from collections.abc import Sequence

from fastapi import APIRouter, Depends

from app.core.deps import get_ai_model_service
from app.core.security import get_current_user
from app.models.db_models import AIModel, User
from app.models.schemas import AIModelResponse
from app.services.ai_model import AIModelService

router = APIRouter()


@router.get("/", response_model=list[AIModelResponse])
async def list_models(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    service: AIModelService = Depends(get_ai_model_service),
) -> Sequence[AIModel]:
    return await service.get_models(active_only=active_only)
