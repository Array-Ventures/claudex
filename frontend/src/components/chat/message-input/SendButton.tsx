import { Send, Pause } from 'lucide-react';
import { Button } from '@/components/ui';

export interface SendButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  hasMessage?: boolean;
  className?: string;
}

export function SendButton({
  isLoading,
  disabled,
  onClick,
  type = 'button',
  hasMessage = false,
  className = '',
}: SendButtonProps) {
  const baseClasses =
    'p-1.5 rounded-full transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const scaleClass = hasMessage && !disabled ? 'scale-100' : 'scale-90';

  let colorClasses;
  if (isLoading) {
    colorClasses = 'bg-error-500 hover:bg-error-600';
  } else if (hasMessage) {
    colorClasses = 'bg-text-primary dark:bg-text-dark-primary hover:opacity-80';
  } else {
    colorClasses = 'bg-surface-tertiary dark:bg-surface-dark-tertiary';
  }

  const cursorClass = !isLoading && !hasMessage ? 'cursor-not-allowed' : '';

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant="unstyled"
      className={`${baseClasses} ${scaleClass} ${colorClasses} ${cursorClass} ${className}`}
      aria-label={isLoading ? 'Stop generating' : 'Send message'}
    >
      {isLoading ? (
        <Pause className="h-3.5 w-3.5 animate-pulse text-white" />
      ) : (
        <Send
          className={`h-3.5 w-3.5 transition-transform ${hasMessage ? 'text-text-dark-primary dark:text-text-primary' : 'text-text-quaternary'}`}
        />
      )}
    </Button>
  );
}
