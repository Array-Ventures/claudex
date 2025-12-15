import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { FileTreeContext, FileTreeContextValue } from './fileTreeContext';

export interface FileTreeProviderProps extends FileTreeContextValue {
  children: ReactNode;
}

export function FileTreeProvider({
  children,
  selectedFile,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
}: FileTreeProviderProps) {
  const value = useMemo(
    () => ({ selectedFile, expandedFolders, onFileSelect, onToggleFolder }),
    [selectedFile, expandedFolders, onFileSelect, onToggleFolder],
  );

  return <FileTreeContext.Provider value={value}>{children}</FileTreeContext.Provider>;
}
