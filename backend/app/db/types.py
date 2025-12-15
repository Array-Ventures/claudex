import uuid as uuid_module
from typing import Any

from cryptography.fernet import InvalidToken
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.types import TypeDecorator


class GUID(UUID):
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return value
        return str(value)

    def process_result_value(
        self, value: Any, dialect: Dialect
    ) -> uuid_module.UUID | None:
        if value is None:
            return value
        if not isinstance(value, uuid_module.UUID):
            return uuid_module.UUID(value)
        return value


class EncryptedString(TypeDecorator[str]):
    impl = String
    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        from app.core.security import encrypt_value

        return encrypt_value(value)

    def process_result_value(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        from app.core.security import decrypt_value

        try:
            return decrypt_value(value)
        except InvalidToken:
            # Return raw value if decryption fails (e.g., unencrypted legacy data)
            return value
