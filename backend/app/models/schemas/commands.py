from typing import Literal

from pydantic import BaseModel, Field


class CommandResponse(BaseModel):
    name: str = Field(..., description="Command name (without /)")
    description: str = Field(..., description="What the command does")
    content: str = Field(..., description="Markdown content (the prompt)")
    enabled: bool = Field(default=True, description="Whether the command is enabled")
    argument_hint: str | None = Field(
        None, description="Argument hint like '<pr-number> [priority]'"
    )
    allowed_tools: list[str] | None = Field(None, description="List of allowed tools")
    model: (
        Literal[
            "claude-sonnet-4-5-20250929",
            "claude-opus-4-5-20251101",
            "claude-haiku-4-5-20251001",
        ]
        | None
    ) = Field(None, description="Model override")


class CommandUpdateRequest(BaseModel):
    content: str = Field(
        ..., description="Updated markdown content with YAML frontmatter"
    )


class CommandDeleteResponse(BaseModel):
    status: Literal["deleted", "not_found"]
