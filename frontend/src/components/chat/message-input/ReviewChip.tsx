import { X, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LineReview } from '@/types/review.types';

interface ReviewChipProps {
  review: LineReview;
  onRemove?: (reviewId: string) => void;
}

export function ReviewChip({ review, onRemove }: ReviewChipProps) {
  const fileName = review.filePath.split('/').pop() || review.filePath;
  const lineRange =
    review.lineStart === review.lineEnd
      ? `line ${review.lineStart}`
      : `lines ${review.lineStart}-${review.lineEnd}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1',
        'bg-surface-tertiary dark:bg-surface-dark-tertiary',
        'border border-border dark:border-border-dark',
        'rounded text-xs',
        'max-w-xs',
      )}
    >
      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary dark:text-text-dark-tertiary" />

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <span className="truncate font-medium text-text-primary dark:text-text-dark-primary">
          {fileName}
        </span>
        <span className="flex-shrink-0 text-text-tertiary dark:text-text-dark-tertiary">
          {lineRange}
        </span>
      </div>

      {onRemove && (
        <button
          onClick={() => onRemove(review.id)}
          className={cn(
            'flex-shrink-0 rounded p-0.5 hover:bg-surface-hover dark:hover:bg-surface-dark-hover',
            'text-text-tertiary dark:text-text-dark-tertiary',
            'hover:text-text-primary dark:hover:text-text-dark-primary',
            'transition-colors',
          )}
          aria-label="Remove review"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
