import type { Chat, Message } from './chat.types';

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export type PaginatedChats = PaginatedResponse<Chat>;
export type PaginatedMessages = PaginatedResponse<Message>;
