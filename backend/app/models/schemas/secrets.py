from pydantic import BaseModel


class Secret(BaseModel):
    key: str
    value: str
    isNew: bool = False


class GetSecretsResponse(BaseModel):
    secrets: list[Secret]


class SecretResponse(BaseModel):
    key: str
    value: str


class SecretsListResponse(BaseModel):
    secrets: list[SecretResponse]


class MessageResponse(BaseModel):
    message: str
