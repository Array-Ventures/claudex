import { useCallback } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries';
import type { Message, PaginatedMessages } from '@/types';

interface UseMessageCacheParams {
  chatId: string | undefined;
  queryClient: QueryClient;
}

export function useMessageCache({ chatId, queryClient }: UseMessageCacheParams) {
  const updateMessageInCache = useCallback(
    (messageId: string, updater: (msg: Message) => Message) => {
      if (!chatId) return;

      queryClient.setQueryData(
        queryKeys.messages(chatId),
        (oldData: { pages: PaginatedMessages[]; pageParams: unknown[] } | undefined) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: PaginatedMessages) => ({
              ...page,
              items: page.items.map((msg: Message) => (msg.id === messageId ? updater(msg) : msg)),
            })),
          };
        },
      );
    },
    [chatId, queryClient],
  );

  const addMessageToCache = useCallback(
    (message: Message, userMessage?: Message) => {
      if (!chatId) return;

      queryClient.setQueryData(
        queryKeys.messages(chatId),
        (oldData: { pages: PaginatedMessages[]; pageParams: unknown[] } | undefined) => {
          if (!oldData?.pages || oldData.pages.length === 0) return oldData;

          const lastPageIndex = oldData.pages.length - 1;
          const newLastPageItems = [...oldData.pages[lastPageIndex].items];

          if (userMessage && !newLastPageItems.some((msg) => msg.id === userMessage.id)) {
            newLastPageItems.push(userMessage);
          }

          const lastMessage = newLastPageItems[newLastPageItems.length - 1];
          if (lastMessage?.id === message.id) {
            newLastPageItems[newLastPageItems.length - 1] = message;
          } else {
            newLastPageItems.push(message);
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page, idx) =>
              idx === lastPageIndex ? { ...page, items: newLastPageItems } : page,
            ),
          };
        },
      );
    },
    [chatId, queryClient],
  );

  const removeMessagesFromCache = useCallback(
    (messageIds: string[]) => {
      if (!chatId || messageIds.length === 0) return;

      const idsToRemove = new Set(messageIds);
      queryClient.setQueryData(
        queryKeys.messages(chatId),
        (oldData: { pages: PaginatedMessages[]; pageParams: unknown[] } | undefined) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter((msg) => !idsToRemove.has(msg.id)),
            })),
          };
        },
      );
    },
    [chatId, queryClient],
  );

  return {
    updateMessageInCache,
    addMessageToCache,
    removeMessagesFromCache,
  };
}
