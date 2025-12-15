import { useEffect, useState } from 'react';
import { useContextUsageQuery } from '@/hooks/queries';
import type { Chat } from '@/types';
import { CONTEXT_WINDOW_TOKENS } from '@/config/constants';

interface ContextUsageState {
  tokensUsed: number;
  contextWindow: number;
}

interface UseContextUsageStateResult {
  contextUsage: ContextUsageState;
  refetchContextUsage: () => Promise<unknown> | void;
}

export function useContextUsageState(
  chatId: string | undefined,
  currentChat: Chat | undefined,
): UseContextUsageStateResult {
  const [contextUsage, setContextUsage] = useState<ContextUsageState>({
    tokensUsed: 0,
    contextWindow: CONTEXT_WINDOW_TOKENS,
  });

  useEffect(() => {
    if (!chatId) {
      setContextUsage({ tokensUsed: 0, contextWindow: CONTEXT_WINDOW_TOKENS });
      return;
    }

    setContextUsage({
      tokensUsed: currentChat?.context_token_usage ?? 0,
      contextWindow: CONTEXT_WINDOW_TOKENS,
    });
  }, [chatId, currentChat?.context_token_usage]);

  const { data: contextUsageData, refetch: refetchContextUsage } = useContextUsageQuery(
    chatId || '',
    { enabled: !!chatId },
  );

  useEffect(() => {
    if (!chatId || !contextUsageData) return;

    setContextUsage({
      tokensUsed: contextUsageData.tokens_used ?? 0,
      contextWindow: contextUsageData.context_window ?? CONTEXT_WINDOW_TOKENS,
    });
  }, [chatId, contextUsageData]);

  return { contextUsage, refetchContextUsage };
}
