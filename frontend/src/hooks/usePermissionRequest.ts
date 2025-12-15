import { useState, useCallback } from 'react';
import { permissionService } from '@/services/permissionService';
import { usePermissionStore, useUIStore } from '@/store';
import type { PermissionRequest } from '@/types';

type ApiError = Error & { status?: number };

function isExpiredRequestError(error: unknown): boolean {
  return (error as ApiError)?.status === 404;
}

export function usePermissionRequest(chatId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);

  const pendingRequests = usePermissionStore((state) => state.pendingRequests);
  const setPermissionRequest = usePermissionStore((state) => state.setPermissionRequest);
  const clearPermissionRequest = usePermissionStore((state) => state.clearPermissionRequest);
  const setPermissionMode = useUIStore((state) => state.setPermissionMode);

  const pendingRequest = chatId ? (pendingRequests.get(chatId) ?? null) : null;

  const handlePermissionRequest = useCallback(
    (request: PermissionRequest) => {
      if (!chatId) return;
      setPermissionRequest(chatId, request);
    },
    [chatId, setPermissionRequest],
  );

  const handleApprove = useCallback(async () => {
    if (!chatId || !pendingRequest) {
      return;
    }

    setIsLoading(true);
    try {
      await permissionService.respondToPermission(chatId, pendingRequest.request_id, true);
      clearPermissionRequest(chatId);
      if (pendingRequest.tool_name === 'ExitPlanMode') {
        setPermissionMode('auto');
      }
    } catch (error) {
      if (isExpiredRequestError(error)) {
        clearPermissionRequest(chatId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [chatId, pendingRequest, clearPermissionRequest, setPermissionMode]);

  const handleReject = useCallback(
    async (alternativeInstruction?: string) => {
      if (!chatId || !pendingRequest) {
        return;
      }

      setIsLoading(true);
      try {
        await permissionService.respondToPermission(
          chatId,
          pendingRequest.request_id,
          false,
          alternativeInstruction,
        );
        clearPermissionRequest(chatId);
      } catch (error) {
        if (isExpiredRequestError(error)) {
          clearPermissionRequest(chatId);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [chatId, pendingRequest, clearPermissionRequest],
  );

  return {
    pendingRequest,
    isLoading,
    handlePermissionRequest,
    handleApprove,
    handleReject,
  };
}
