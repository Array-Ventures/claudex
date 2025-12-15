import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, children, requiredIndicator = false, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        'flex items-center gap-2 text-sm font-medium text-text-primary dark:text-text-dark-primary',
        className,
      )}
      {...props}
    >
      {children}
      {requiredIndicator ? <span className="text-error-500">*</span> : null}
    </label>
  );
});

Label.displayName = 'Label';
