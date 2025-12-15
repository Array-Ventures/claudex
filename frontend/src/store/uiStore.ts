import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ThemeState,
  PermissionModeState,
  ThinkingModeState,
  UIState,
  UIActions,
} from '@/types';

type UIStoreState = ThemeState &
  PermissionModeState &
  ThinkingModeState &
  Pick<UIState, 'sidebarOpen' | 'currentView'> &
  Pick<UIActions, 'setSidebarOpen' | 'setCurrentView'>;

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      // Permission Mode
      permissionMode: 'auto',
      setPermissionMode: (mode) => set({ permissionMode: mode }),

      // Thinking Mode
      thinkingMode: null,
      setThinkingMode: (mode) => set({ thinkingMode: mode }),

      // UI State
      sidebarOpen: false,
      currentView: 'agent',
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        permissionMode: state.permissionMode,
        thinkingMode: state.thinkingMode,
        sidebarOpen: state.sidebarOpen,
        currentView: state.currentView,
      }),
    },
  ),
);
