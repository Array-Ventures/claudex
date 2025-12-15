"""
Models package for the application.

Contains database models (SQLAlchemy ORM models) and schemas
(Pydantic models for API request/response validation).
"""

# Export all models for easy importing
from .db_models import (
    User,
    Chat,
    Message,
    MessageAttachment,
    MessageRole,
    AttachmentType,
)
from .schemas import (
    UserBase,
    UserCreate,
    UserOut,
    Token,
    TokenData,
    MessageAttachmentBase,
    MessageAttachment as MessageAttachmentSchema,
    ChatRequest,
    MessageBase,
    Message as MessageSchema,
    ChatBase,
    ChatCreate,
    Chat as ChatSchema,
    PortPreviewLink,
    PreviewLinksResponse,
    ExecuteCommandResponse,
    Secret,
    GetSecretsResponse,
    AddSecretRequest,
    UpdateFileRequest,
    UpdateFileResponse,
)
