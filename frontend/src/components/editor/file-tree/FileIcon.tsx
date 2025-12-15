import { Folder, FolderOpen, File } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileIconProps {
  name: string;
  isFolder: boolean;
  isExpanded?: boolean;
  className?: string;
}

export function FileIcon({ isFolder, isExpanded, className }: FileIconProps) {
  const baseClassName = cn(
    'text-text-quaternary dark:text-text-dark-quaternary transition-colors',
    className,
  );

  if (isFolder) {
    const FolderIcon = isExpanded ? FolderOpen : Folder;
    return <FolderIcon className={baseClassName} />;
  }

  return <File className={baseClassName} />;
}
