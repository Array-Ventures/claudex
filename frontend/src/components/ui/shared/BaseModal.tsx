import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { modalBackdropClass, modalContainerClass, modalSizes, Z_INDEX } from './modalConstants';
import { cn } from '@/utils/cn';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof modalSizes;
  zIndex?: keyof typeof Z_INDEX;
  className?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  zIndex = 'modal',
  className,
}: BaseModalProps) {
  if (!isOpen) return null;

  const zIndexClass =
    zIndex === 'modalHighest' ? 'z-[200]' : zIndex === 'modalHigh' ? 'z-[100]' : 'z-50';

  return createPortal(
    <div className={cn(modalBackdropClass, zIndexClass)} onClick={onClose}>
      <div
        className={cn(modalContainerClass, modalSizes[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
