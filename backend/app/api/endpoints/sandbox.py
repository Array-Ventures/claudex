from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import get_chat_service, get_sandbox_service
from app.core.security import get_current_user
from app.models.db_models import User
from app.models.schemas import (
    AddSecretRequest,
    FileContentResponse,
    FileMetadata,
    MessageResponse,
    PortPreviewLink,
    PreviewLinksResponse,
    SandboxFilesMetadataResponse,
    SecretResponse,
    SecretsListResponse,
    UpdateFileRequest,
    UpdateFileResponse,
    UpdateIDEThemeRequest,
    UpdateSecretRequest,
)
from app.services.chat import ChatService
from app.services.exceptions import SandboxException
from app.services.sandbox import SandboxService


router = APIRouter()


async def _verify_sandbox_ownership(
    sandbox_id: str,
    current_user: User,
    chat_service: ChatService,
) -> None:
    exists = await chat_service.sandbox_exists(sandbox_id)
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox not found",
        )
    has_access = await chat_service.verify_sandbox_access(sandbox_id, current_user.id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this sandbox",
        )


@router.get("/{sandbox_id}/preview-links", response_model=PreviewLinksResponse)
async def get_preview_links(
    sandbox_id: str,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> PreviewLinksResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)
    links = await sandbox_service.get_preview_links(sandbox_id)
    return PreviewLinksResponse(links=[PortPreviewLink(**link) for link in links])


@router.get(
    "/{sandbox_id}/files/metadata",
    response_model=SandboxFilesMetadataResponse,
)
async def get_files_metadata(
    sandbox_id: str,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> SandboxFilesMetadataResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)
    files = await sandbox_service.get_files_metadata(sandbox_id)
    return SandboxFilesMetadataResponse(files=[FileMetadata(**f) for f in files])


@router.get(
    "/{sandbox_id}/files/content/{file_path:path}", response_model=FileContentResponse
)
async def get_file_content(
    sandbox_id: str,
    file_path: str,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> FileContentResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        file_data = await sandbox_service.get_file_content(sandbox_id, file_path)
        return FileContentResponse(**file_data)
    except SandboxException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file content: {str(e)}",
        )


@router.put("/{sandbox_id}/files", response_model=UpdateFileResponse)
async def update_file_in_sandbox(
    sandbox_id: str,
    request: UpdateFileRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> UpdateFileResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        await sandbox_service.write_file(sandbox_id, request.file_path, request.content)
        return UpdateFileResponse(
            success=True, message=f"File {request.file_path} updated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update file: {str(e)}",
        )


@router.get("/{sandbox_id}/secrets", response_model=SecretsListResponse)
async def get_secrets(
    sandbox_id: str,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> SecretsListResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)
    try:
        secrets = await sandbox_service.get_secrets(sandbox_id)
        return SecretsListResponse(secrets=[SecretResponse(**s) for s in secrets])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get secrets: {str(e)}",
        )


@router.post("/{sandbox_id}/secrets", response_model=MessageResponse)
async def add_secret(
    sandbox_id: str,
    secret_data: AddSecretRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> MessageResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        await sandbox_service.add_secret(sandbox_id, secret_data.key, secret_data.value)
        return MessageResponse(message=f"Secret {secret_data.key} added successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add secret: {str(e)}",
        )


@router.put("/{sandbox_id}/secrets/{key}", response_model=MessageResponse)
async def update_secret(
    sandbox_id: str,
    key: str,
    secret_data: UpdateSecretRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> MessageResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        await sandbox_service.update_secret(sandbox_id, key, secret_data.value)
        return MessageResponse(message=f"Secret {key} updated successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update secret: {str(e)}",
        )


@router.delete("/{sandbox_id}/secrets/{key}", response_model=MessageResponse)
async def delete_secret(
    sandbox_id: str,
    key: str,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> MessageResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        await sandbox_service.delete_secret(sandbox_id, key)
        return MessageResponse(message=f"Secret {key} deleted successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete secret: {str(e)}",
        )


@router.put("/{sandbox_id}/ide-theme", response_model=MessageResponse)
async def update_ide_theme(
    sandbox_id: str,
    request: UpdateIDEThemeRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> MessageResponse:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        await sandbox_service.update_ide_theme(sandbox_id, request.theme)
        return MessageResponse(message=f"IDE theme updated to {request.theme}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update IDE theme: {str(e)}",
        )


@router.get("/{sandbox_id}/download-zip")
async def download_sandbox_files(
    sandbox_id: str,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    sandbox_service: SandboxService = Depends(get_sandbox_service),
) -> Response:
    await _verify_sandbox_ownership(sandbox_id, current_user, chat_service)

    try:
        zip_bytes = await sandbox_service.generate_zip_download(sandbox_id)

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="sandbox_{sandbox_id}.zip"'
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate zip file: {str(e)}",
        )
