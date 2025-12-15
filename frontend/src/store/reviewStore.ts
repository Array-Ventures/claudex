import { create } from 'zustand';
import type { LineReview } from '@/types/review.types';

interface ReviewState {
  reviews: LineReview[];
  addReview: (review: LineReview) => void;
  removeReview: (reviewId: string) => void;
  getReviewsForChat: (chatId: string) => LineReview[];
  clearReviewsForChat: (chatId: string) => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  addReview: (review: LineReview) => {
    set((state) => ({
      reviews: [...state.reviews, review],
    }));
  },
  removeReview: (reviewId: string) => {
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== reviewId),
    }));
  },
  getReviewsForChat: (chatId: string) => {
    return get().reviews.filter((r) => r.chatId === chatId);
  },
  clearReviewsForChat: (chatId: string) => {
    set((state) => ({
      reviews: state.reviews.filter((r) => r.chatId !== chatId),
    }));
  },
}));
