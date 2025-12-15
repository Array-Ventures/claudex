from typing import Literal

from pydantic import BaseModel, Field


class AgentResponse(BaseModel):
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="What the agent does")
    content: str = Field(..., description="Markdown content (the prompt)")
    enabled: bool = Field(default=True, description="Whether the agent is enabled")
    allowed_tools: list[str] | None = Field(None, description="List of allowed tools")
    model: Literal["sonnet", "opus", "haiku", "inherit"] | None = Field(
        default="inherit", description="Model override"
    )


class AgentUpdateRequest(BaseModel):
    content: str = Field(
        ..., description="Updated markdown content with YAML frontmatter"
    )


class AgentDeleteResponse(BaseModel):
    status: Literal["deleted", "not_found"]
