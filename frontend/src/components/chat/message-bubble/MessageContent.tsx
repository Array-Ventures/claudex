import { memo } from 'react';
import { MessageRenderer } from './MessageRenderer';
import type { MessageAttachment } from '@/types';
import { MessageAttachments } from './MessageAttachments';

interface MessageContentProps {
  content: string;
  isBot: boolean;
  attachments?: MessageAttachment[];
  isStreaming: boolean;
  chatId?: string;
}

export const MessageContent = memo(
  ({ content, isBot, attachments, isStreaming, chatId }: MessageContentProps) => {
    if (!isBot) {
      return (
        <div className="space-y-4">
          <MessageAttachments attachments={attachments} />
          <MessageRenderer content={content} isStreaming={isStreaming} chatId={chatId} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <MessageRenderer content={content} isStreaming={isStreaming} chatId={chatId} />

        <MessageAttachments attachments={attachments} className="mt-3" />
      </div>
    );
  },
);
