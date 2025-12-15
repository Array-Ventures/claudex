from typing import Literal

from pydantic import BaseModel, Field


class SkillResponse(BaseModel):
    name: str = Field(..., description="Sanitized skill name")
    description: str = Field(..., description="Skill description from YAML frontmatter")
    enabled: bool = Field(default=True, description="Whether the skill is enabled")
    size_bytes: int = Field(..., description="Total decompressed size in bytes", ge=0)
    file_count: int = Field(
        ..., description="Number of files in the skill package", ge=0
    )


class SkillDeleteResponse(BaseModel):
    status: Literal["deleted", "not_found"]
