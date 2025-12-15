import { memo } from 'react';
import { AttachmentViewer } from '@/components/ui';
import type { MessageAttachment } from '@/types';

interface MessageAttachmentsProps {
  attachments?: MessageAttachment[];
  className?: string;
}

export const MessageAttachments = memo(
  ({ attachments, className = '' }: MessageAttachmentsProps) => {
    if (!attachments || attachments.length === 0) {
      return null;
    }

    return (
      <div className={className}>
        <AttachmentViewer attachments={attachments} />
      </div>
    );
  },
);
