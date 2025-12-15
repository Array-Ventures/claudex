import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FieldMessageProps {
  children: ReactNode;
  variant?: 'default' | 'error' | 'success';
  className?: string;
}

export function FieldMessage({ children, variant = 'default', className }: FieldMessageProps) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn(
        'mt-1 text-xs',
        variant === 'error' && 'text-error-600 dark:text-error-400',
        variant === 'success' && 'text-success-600 dark:text-success-400',
        variant === 'default' && 'text-text-tertiary dark:text-text-dark-tertiary',
        className,
      )}
    >
      {children}
    </p>
  );
}
