import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-surface-tertiary dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-tertiary border-border dark:border-border-dark',
  info: 'bg-info-100 dark:bg-info-900/20 text-info-700 dark:text-info-300 border-info-300 dark:border-info-700',
  success:
    'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-300 dark:border-success-700',
  warning:
    'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 border-warning-300 dark:border-warning-700',
  error:
    'bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-300 border-error-300 dark:border-error-700',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'default', className, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
