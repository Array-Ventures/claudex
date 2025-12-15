import { FolderOpen, FileCode } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 px-4 py-8">
      <div className="relative">
        <FolderOpen className="h-12 w-12 text-text-quaternary dark:text-text-dark-quaternary" />
        <FileCode className="absolute -bottom-1 -right-1 h-6 w-6 text-text-tertiary dark:text-text-dark-tertiary" />
      </div>

      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          No files yet
        </p>
        <p className="max-w-48 text-xs text-text-tertiary dark:text-text-dark-tertiary">
          Let the AI generate code for your project
        </p>
      </div>
    </div>
  );
}
