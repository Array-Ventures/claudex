from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from app.models.db_models import Chat, User
from app.services.sandbox import SandboxService


class TestSandboxPreviewLinks:
    async def test_get_preview_links(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/preview-links",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "links" in data
        assert isinstance(data["links"], list)

    async def test_get_preview_links_unauthorized(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/preview-links",
        )

        assert response.status_code == 401


class TestSandboxFiles:
    async def test_get_files_metadata(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/files/metadata",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert isinstance(data["files"], list)

    async def test_write_file(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture
        test_path = "/home/user/test_integration.txt"
        test_content = "Integration test content"

        write_response = await async_client.put(
            f"/api/v1/sandbox/{chat.sandbox_id}/files",
            json={"file_path": test_path, "content": test_content},
            headers=auth_headers,
        )

        assert write_response.status_code == 200
        assert write_response.json()["success"] is True

    async def test_get_file_content(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/files/content/test_integration.txt",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "path" in data
        assert data["path"] == "test_integration.txt"
        assert data["content"] == "Integration test content"

    async def test_get_file_not_found(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/files/content/nonexistent/file.txt",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestSandboxSecrets:
    async def test_get_secrets(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/secrets",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "secrets" in data
        assert isinstance(data["secrets"], list)

    async def test_add_and_delete_secret(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture
        secret_key = "TEST_SECRET_KEY"
        secret_value = "test_secret_value"

        add_response = await async_client.post(
            f"/api/v1/sandbox/{chat.sandbox_id}/secrets",
            json={"key": secret_key, "value": secret_value},
            headers=auth_headers,
        )

        assert add_response.status_code == 200
        assert secret_key in add_response.json()["message"]

        delete_response = await async_client.delete(
            f"/api/v1/sandbox/{chat.sandbox_id}/secrets/{secret_key}",
            headers=auth_headers,
        )

        assert delete_response.status_code == 200


class TestSandboxDownload:
    async def test_download_zip(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.get(
            f"/api/v1/sandbox/{chat.sandbox_id}/download-zip",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/zip"
        assert len(response.content) > 0


class TestSandboxIdeTheme:
    async def test_set_ide_theme(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        auth_headers: dict[str, str],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.put(
            f"/api/v1/sandbox/{chat.sandbox_id}/ide-theme",
            json={"theme": "dark"},
            headers=auth_headers,
        )

        assert response.status_code == 200

    async def test_set_ide_theme_unauthorized(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
    ) -> None:
        _, chat, _ = integration_chat_fixture

        response = await async_client.put(
            f"/api/v1/sandbox/{chat.sandbox_id}/ide-theme",
            json={"theme": "dark"},
        )

        assert response.status_code == 401


class TestSandboxUnauthorized:
    @pytest.mark.parametrize(
        "method,endpoint_suffix,json_body",
        [
            ("GET", "/files/metadata", None),
            ("PUT", "/files", {"file_path": "/test.txt", "content": "test"}),
            ("GET", "/files/content/test.txt", None),
            ("GET", "/secrets", None),
            ("POST", "/secrets", {"key": "TEST", "value": "test"}),
            ("DELETE", "/secrets/TEST", None),
            ("GET", "/download-zip", None),
        ],
    )
    async def test_sandbox_endpoints_unauthorized(
        self,
        async_client: AsyncClient,
        integration_chat_fixture: tuple[User, Chat, SandboxService],
        method: str,
        endpoint_suffix: str,
        json_body: dict | None,
    ) -> None:
        _, chat, _ = integration_chat_fixture
        endpoint = f"/api/v1/sandbox/{chat.sandbox_id}{endpoint_suffix}"

        if method == "GET":
            response = await async_client.get(endpoint)
        elif method == "PUT":
            response = await async_client.put(endpoint, json=json_body)
        elif method == "POST":
            response = await async_client.post(endpoint, json=json_body)
        elif method == "DELETE":
            response = await async_client.delete(endpoint)
        else:
            response = await async_client.request(method, endpoint)

        assert response.status_code == 401


class TestSandboxNotFound:
    @pytest.mark.parametrize(
        "method,endpoint_suffix,json_body",
        [
            ("GET", "/preview-links", None),
            ("GET", "/files/metadata", None),
            ("PUT", "/files", {"file_path": "/test.txt", "content": "test"}),
            ("GET", "/secrets", None),
            ("POST", "/secrets", {"key": "TEST", "value": "test"}),
            ("GET", "/download-zip", None),
            ("PUT", "/ide-theme", {"theme": "dark"}),
        ],
    )
    async def test_sandbox_endpoints_not_found(
        self,
        async_client: AsyncClient,
        integration_user_fixture: User,
        auth_headers: dict[str, str],
        method: str,
        endpoint_suffix: str,
        json_body: dict | None,
    ) -> None:
        fake_sandbox_id = f"fake-sandbox-{uuid.uuid4().hex[:8]}"
        endpoint = f"/api/v1/sandbox/{fake_sandbox_id}{endpoint_suffix}"

        if method == "GET":
            response = await async_client.get(endpoint, headers=auth_headers)
        elif method == "PUT":
            response = await async_client.put(
                endpoint, json=json_body, headers=auth_headers
            )
        elif method == "POST":
            response = await async_client.post(
                endpoint, json=json_body, headers=auth_headers
            )
        else:
            response = await async_client.request(
                method, endpoint, headers=auth_headers
            )

        assert response.status_code == 404
