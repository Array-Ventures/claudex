import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        'inline-flex animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});

Spinner.displayName = 'Spinner';
