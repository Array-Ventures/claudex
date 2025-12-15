import { ReactNode, createContext, useContext, useEffect } from 'react';

export interface LayoutContextValue {
  sidebar: ReactNode | null;
  setSidebar: (content: ReactNode | null) => void;
}

export const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a Layout component');
  }
  return context;
}

export function useLayoutSidebar(sidebar: ReactNode | null) {
  const { setSidebar } = useLayoutContext();

  useEffect(() => {
    setSidebar(sidebar);
    return () => {
      setSidebar(null);
    };
  }, [setSidebar, sidebar]);
}
