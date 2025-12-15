from typing import Final

MAX_RESOURCE_NAME_LENGTH: Final[int] = 50
MIN_RESOURCE_NAME_LENGTH: Final[int] = 2
MAX_RESOURCES_PER_USER: Final[int] = 10
MAX_RESOURCE_SIZE_BYTES: Final[int] = 100 * 1024

REDIS_KEY_CHAT_TASK: Final[str] = "chat:{chat_id}:task"
REDIS_KEY_CHAT_STREAM: Final[str] = "chat:{chat_id}:stream"
REDIS_KEY_CHAT_REVOKED: Final[str] = "chat:{chat_id}:revoked"
REDIS_KEY_CHAT_CANCEL: Final[str] = "chat:{chat_id}:cancel"
REDIS_KEY_PERMISSION_REQUEST: Final[str] = "permission_request:{request_id}"
REDIS_KEY_PERMISSION_RESPONSE: Final[str] = "permission_response:{request_id}"
REDIS_KEY_USER_SETTINGS: Final[str] = "user_settings:{user_id}"

SANDBOX_AUTO_PAUSE_TIMEOUT: Final[int] = 3000
