import { memo } from 'react';
import { ReviewChip } from './ReviewChip';
import type { LineReview } from '@/types/review.types';

interface ReviewChipsBarProps {
  reviews: Array<LineReview & { id: string; chatId: string }>;
  onRemove: (id: string) => void;
}

export const ReviewChipsBar = memo(function ReviewChipsBar({
  reviews,
  onRemove,
}: ReviewChipsBarProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="px-3 pb-1 pt-2">
      <div className="flex flex-wrap items-start gap-2 pb-1">
        {reviews.map((review) => (
          <ReviewChip key={review.id} review={review} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
});
