import { create } from 'zustand';
import type { Chat, UIActions, UIState } from '@/types';

type ChatStoreType = Pick<UIState, 'currentChat' | 'attachedFiles'> &
  Pick<UIActions, 'setCurrentChat' | 'setAttachedFiles'>;

export const useChatStore = create<ChatStoreType>((set) => ({
  currentChat: null,
  attachedFiles: [],
  setCurrentChat: (chat: Chat | null) => set({ currentChat: chat }),
  setAttachedFiles: (files) => set({ attachedFiles: files }),
}));
