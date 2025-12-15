from typing import cast

from sqlalchemy import select

from app.models.db_models import AIModel, ModelProvider
from app.services.base import BaseDbService, SessionFactoryType


class AIModelService(BaseDbService[AIModel]):
    def __init__(self, session_factory: SessionFactoryType | None = None) -> None:
        super().__init__(session_factory)

    async def get_models(self, active_only: bool = True) -> list[AIModel]:
        async with self.session_factory() as db:
            query = select(AIModel).order_by(AIModel.sort_order, AIModel.name)
            if active_only:
                query = query.filter(AIModel.is_active.is_(True))
            result = await db.execute(query)
            return list(result.scalars().all())

    async def get_model_by_model_id(self, model_id: str) -> AIModel | None:
        async with self.session_factory() as db:
            result = await db.execute(
                select(AIModel).filter(AIModel.model_id == model_id)
            )
            return cast(AIModel | None, result.scalar_one_or_none())

    async def get_model_provider(self, model_id: str) -> ModelProvider | None:
        model = await self.get_model_by_model_id(model_id)
        return model.provider if model else None
