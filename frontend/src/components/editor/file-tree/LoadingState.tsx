import { Spinner } from '@/components/ui';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 px-4 py-8">
      <Spinner size="lg" className="text-brand-500" />
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          Loading files...
        </p>
        <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary">
          Fetching project structure
        </p>
      </div>
    </div>
  );
}
