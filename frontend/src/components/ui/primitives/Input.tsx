import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { baseInputClasses, inputErrorClasses } from './inputStyles';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  variant?: 'default' | 'unstyled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', hasError = false, disabled, variant = 'default', ...props },
  ref,
) {
  if (variant === 'unstyled') {
    return <input ref={ref} type={type} className={className} disabled={disabled} {...props} />;
  }

  return (
    <input
      ref={ref}
      type={type}
      className={cn('h-10 w-full', baseInputClasses, hasError && inputErrorClasses, className)}
      disabled={disabled}
      {...props}
    />
  );
});

Input.displayName = 'Input';
