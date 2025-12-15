import { memo, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { FileStructure } from '@/types';
import { PreviewContainer } from './PreviewContainer';
import { previewBackgroundClass } from './previewConstants';
import { getDisplayFileName } from './previewUtils';

interface HtmlPreviewProps {
  file: FileStructure;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const HtmlPreview = memo(function HtmlPreview({
  file,
  isFullscreen = false,
  onToggleFullscreen,
}: HtmlPreviewProps) {
  const sanitizedContent = useMemo(() => {
    if (!file.content) return '';
    return DOMPurify.sanitize(file.content, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['style', 'link'],
      ADD_ATTR: ['target', 'rel'],
    });
  }, [file.content]);

  if (!file.content) {
    return (
      <PreviewContainer
        fileName={getDisplayFileName(file)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        contentClassName={`flex items-center justify-center ${previewBackgroundClass}`}
      >
        <span className="text-text-tertiary dark:text-text-dark-tertiary">
          No content to preview
        </span>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer
      fileName={getDisplayFileName(file)}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
    >
      <iframe
        srcDoc={sanitizedContent}
        className="h-full w-full border-0"
        title={`HTML Preview: ${file.path}`}
        sandbox="allow-scripts allow-same-origin"
      />
    </PreviewContainer>
  );
});
