import { useEffect } from 'react';
import { detectFileType } from '@/utils/fileTypes';
import { createInitialMessage } from '@/utils/message';
import type { Message } from '@/types';

interface UseMessageInitializationParams {
  fetchedMessages: Message[];
  chatId: string | undefined;
  selectedModelId: string | null | undefined;
  hasMessages: boolean;
  initialPromptFromRoute: string | null;
  initialPromptSent: boolean;
  wasAborted: boolean;
  attachedFiles: File[];
  isLoading: boolean;
  isStreaming: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInitialPrompt: (prompt: string) => void;
}

export function useMessageInitialization({
  fetchedMessages,
  chatId,
  selectedModelId,
  hasMessages,
  initialPromptFromRoute,
  initialPromptSent,
  wasAborted,
  attachedFiles,
  isLoading,
  isStreaming,
  setMessages,
  setInitialPrompt,
}: UseMessageInitializationParams) {
  useEffect(() => {
    if (!fetchedMessages || !chatId || isLoading || wasAborted) return;

    // Skip reprocessing during streaming to preserve attachment references and prevent image flashing
    if (isStreaming && hasMessages) return;

    const formattedMessages = fetchedMessages.map((msg: Message) => {
      const processedAttachments = msg.attachments?.map((attachment) => {
        const fileType = detectFileType(
          attachment.filename || '',
          attachment.file_type === 'image' ? 'image/jpeg' : undefined,
        );

        return { ...attachment, file_type: fileType };
      });

      return {
        id: msg.id || crypto.randomUUID(),
        chat_id: msg.chat_id,
        content: msg.content,
        role: msg.role,
        is_bot: msg.role === 'assistant',
        attachments: processedAttachments,
        created_at: msg.created_at,
        model_id: msg.model_id,
      };
    });

    if (
      initialPromptFromRoute &&
      formattedMessages.length === 0 &&
      !initialPromptSent &&
      selectedModelId
    ) {
      const initialMessage = createInitialMessage(
        initialPromptFromRoute,
        attachedFiles,
        selectedModelId,
        chatId,
      );
      setMessages([initialMessage]);
      setInitialPrompt(initialPromptFromRoute);
    } else if (formattedMessages.length > 0) {
      setMessages(formattedMessages);
    }
  }, [
    fetchedMessages,
    chatId,
    selectedModelId,
    initialPromptSent,
    wasAborted,
    hasMessages,
    initialPromptFromRoute,
    attachedFiles,
    isLoading,
    isStreaming,
    setMessages,
    setInitialPrompt,
  ]);
}
