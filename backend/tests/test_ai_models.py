from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.db_models import User


class TestListModels:
    @pytest.mark.parametrize(
        "active_only,check_all_active",
        [
            (True, True),
            (False, False),
        ],
    )
    async def test_list_models(
        self,
        async_client: AsyncClient,
        integration_user_fixture: User,
        auth_headers: dict[str, str],
        seed_ai_models: None,
        active_only: bool,
        check_all_active: bool,
    ) -> None:
        url = "/api/v1/models/"
        if not active_only:
            url += "?active_only=false"

        response = await async_client.get(url, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        for model in data:
            assert "id" in model
            assert "model_id" in model
            assert "name" in model
            assert "provider" in model
            assert "is_active" in model
            if check_all_active:
                assert model["is_active"] is True

    async def test_list_models_unauthorized(
        self,
        async_client: AsyncClient,
    ) -> None:
        response = await async_client.get("/api/v1/models/")

        assert response.status_code == 401
