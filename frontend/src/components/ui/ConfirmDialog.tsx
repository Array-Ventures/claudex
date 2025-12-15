import { AlertTriangle } from 'lucide-react';
import { BaseModal } from './shared/BaseModal';
import { cancelButtonClass } from './shared/modalConstants';
import { Button } from './primitives/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="md" zIndex="modalHighest">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-error-100 p-1.5 dark:bg-error-500/10">
            <AlertTriangle className="h-4 w-4 text-error-600 dark:text-error-400" />
          </div>
          <h2 className="flex-1 text-sm font-semibold text-text-primary dark:text-text-dark-primary">
            {title}
          </h2>
        </div>

        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{message}</p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cancelButtonClass}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
