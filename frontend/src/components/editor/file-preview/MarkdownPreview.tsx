import { memo } from 'react';
import { MarkDown } from '@/components/ui';
import type { FileStructure } from '@/types';
import { PreviewContainer } from './PreviewContainer';
import { getDisplayFileName } from './previewUtils';

export interface MarkdownPreviewProps {
  file: FileStructure;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const MarkdownPreview = memo(function MarkdownPreview({
  file,
  isFullscreen = false,
  onToggleFullscreen,
}: MarkdownPreviewProps) {
  return (
    <PreviewContainer
      fileName={getDisplayFileName(file)}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
      contentClassName="overflow-auto p-6 prose max-w-none dark:prose-invert"
    >
      <MarkDown content={file.content} />
    </PreviewContainer>
  );
});
