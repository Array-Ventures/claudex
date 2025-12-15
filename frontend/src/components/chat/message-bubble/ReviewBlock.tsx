import React from 'react';
import { ReviewChip } from '@/components/chat/message-input/ReviewChip';
import { LineReview } from '@/types/review.types';
import { logger } from '@/utils/logger';

interface ReviewBlockProps {
  reviews: LineReview[];
}

export const ReviewBlock: React.FC<ReviewBlockProps> = ({ reviews }) => {
  if (reviews.length === 0) return null;

  return (
    <div className="flex flex-wrap items-start gap-2">
      {reviews.map((review) => {
        try {
          return <ReviewChip key={review.id} review={review} />;
        } catch (error) {
          logger.error('Failed to render review', 'ReviewBlock', error);
          return null;
        }
      })}
    </div>
  );
};
