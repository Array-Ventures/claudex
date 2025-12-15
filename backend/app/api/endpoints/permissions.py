import asyncio
import json
import uuid

from fastapi import APIRouter, Header, HTTPException, status

from app.constants import REDIS_KEY_PERMISSION_REQUEST, REDIS_KEY_PERMISSION_RESPONSE
from app.core.config import get_settings
from app.core.security import validate_chat_scoped_token
from app.utils.redis import redis_connection, redis_pubsub
from app.models.schemas import (
    PermissionRequest,
    PermissionRequestResponse,
    PermissionResult,
)
from app.core.celery import SSEEventPublisher

router = APIRouter()
settings = get_settings()


async def _validate_token_for_chat(authorization: str, chat_id: str) -> None:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")
    if not validate_chat_scoped_token(token, chat_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired token for this chat",
        )


def _parse_response_payload(raw_payload: str) -> PermissionResult:
    try:
        data: dict[str, object] = json.loads(raw_payload)
        result: PermissionResult = PermissionResult.model_validate(data)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid response payload",
        ) from exc


@router.post(
    "/chats/{chat_id}/permissions/request",
    response_model=PermissionRequestResponse,
)
async def create_permission_request(
    chat_id: str,
    request: PermissionRequest,
    authorization: str = Header(...),
) -> PermissionRequestResponse:
    await _validate_token_for_chat(authorization, chat_id)

    async with redis_connection() as redis:
        request_id = str(uuid.uuid4())
        request_key = REDIS_KEY_PERMISSION_REQUEST.format(request_id=request_id)
        payload = json.dumps(
            {
                "chat_id": chat_id,
                "tool_name": request.tool_name,
                "tool_input": request.tool_input,
                "timestamp": asyncio.get_running_loop().time(),
            }
        )

        try:
            await redis.setex(
                request_key,
                settings.PERMISSION_REQUEST_TTL_SECONDS,
                payload,
            )

            permission_event_payload = json.dumps(
                {
                    "event": {
                        "type": "permission_request",
                        "request_id": request_id,
                        "tool_name": request.tool_name,
                        "tool_input": request.tool_input,
                    }
                }
            )

            publisher = SSEEventPublisher(redis)
            await publisher.publish_content(
                chat_id,
                permission_event_payload,
                event_id=f"{chat_id}_permission_{request_id[:8]}",
            )

        except Exception as exc:
            await redis.delete(request_key)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create permission request",
            ) from exc

    return PermissionRequestResponse(request_id=request_id)


@router.get(
    "/chats/{chat_id}/permissions/response/{request_id}",
    response_model=PermissionResult,
)
async def get_permission_response(
    chat_id: str,
    request_id: str,
    authorization: str = Header(...),
    timeout: int = 300,
) -> PermissionResult:
    await _validate_token_for_chat(authorization, chat_id)

    async with redis_connection() as redis:
        request_key = REDIS_KEY_PERMISSION_REQUEST.format(request_id=request_id)

        request_data = await redis.get(request_key)
        if not request_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission request not found or expired",
            )

        try:
            request_json = json.loads(request_data)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid stored permission data",
            ) from exc

        if request_json.get("chat_id") != chat_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission request does not belong to this chat",
            )

        # Refresh TTL so the request remains available while waiting.
        await redis.setex(
            request_key,
            settings.PERMISSION_REQUEST_TTL_SECONDS,
            json.dumps(request_json),
        )

        channel = REDIS_KEY_PERMISSION_RESPONSE.format(request_id=request_id)

        try:
            async with redis_pubsub(redis, channel) as pubsub:
                try:
                    async with asyncio.timeout(timeout):
                        async for message in pubsub.listen():
                            if message.get("type") != "message":
                                continue

                            try:
                                result = _parse_response_payload(message["data"])
                            except HTTPException:
                                await redis.delete(request_key)
                                raise

                            await redis.delete(request_key)
                            return result

                except asyncio.TimeoutError as exc:
                    await redis.delete(request_key)
                    raise HTTPException(
                        status_code=status.HTTP_408_REQUEST_TIMEOUT,
                        detail="Permission request timed out",
                    ) from exc
        except HTTPException:
            raise
        except Exception as exc:
            await redis.delete(request_key)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get permission response",
            ) from exc

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected state: permission response not received",
    )
