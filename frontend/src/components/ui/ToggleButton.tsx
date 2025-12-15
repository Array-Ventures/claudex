import { memo } from 'react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { Button } from './primitives/Button';

export interface ToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
  position?: 'left' | 'right';
  className?: string;
  iconDirection?: 'default' | 'reverse';
  ariaLabel?: string;
}

export const ToggleButton = memo(function ToggleButton({
  isOpen,
  onClick,
  position = 'right',
  className = '',
  iconDirection = 'default',
  ariaLabel,
}: ToggleButtonProps) {
  const shouldInvert = iconDirection === 'reverse';
  const Icon = isOpen !== shouldInvert ? PanelLeftClose : PanelLeft;

  const tooltipText =
    position === 'left'
      ? isOpen
        ? 'Close sidebar'
        : 'Open sidebar'
      : isOpen
        ? 'Close editor'
        : 'Open editor';

  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      size="icon"
      className={`h-8 w-8 transition-all duration-200 ${className}`}
      aria-label={ariaLabel}
      title={tooltipText}
    >
      <Icon className="h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
    </Button>
  );
});
