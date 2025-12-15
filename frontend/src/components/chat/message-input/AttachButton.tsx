import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui';

export interface AttachButtonProps {
  onAttach?: () => void;
}

export function AttachButton({ onAttach }: AttachButtonProps) {
  return (
    <Button
      type="button"
      onClick={onAttach}
      variant="unstyled"
      className="group rounded-full bg-transparent p-1.5 text-text-tertiary transition-all duration-200 hover:bg-surface-secondary hover:text-text-secondary active:scale-95 dark:text-text-dark-tertiary dark:hover:bg-surface-dark-tertiary dark:hover:text-white"
      aria-label="Attach file"
    >
      <Paperclip className="h-3.5 w-3.5" />
    </Button>
  );
}
