import { memo, ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';

interface SelectItemProps {
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
  children: ReactNode;
}

function SelectItemInner({ isSelected, onSelect, className, children }: SelectItemProps) {
  const baseClasses = 'w-full text-left px-2.5 py-2 rounded-lg';

  const backgroundClasses = isSelected
    ? 'bg-brand-500/10 dark:bg-brand-500/15'
    : 'hover:bg-surface-tertiary/50 dark:hover:bg-white/5';

  return (
    <Button
      onClick={onSelect}
      variant="unstyled"
      className={cn(baseClasses, backgroundClasses, className)}
    >
      {children}
    </Button>
  );
}

export const SelectItem = memo(SelectItemInner);
