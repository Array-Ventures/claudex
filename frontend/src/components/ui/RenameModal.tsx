import { useState, useEffect, useRef, useCallback } from 'react';
import { BaseModal } from './shared/BaseModal';
import { ModalHeader } from './shared/ModalHeader';
import { Button } from './primitives/Button';
import { Input } from './primitives/Input';
import { cancelButtonClass } from './shared/modalConstants';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTitle: string) => Promise<void>;
  currentTitle: string;
  isLoading?: boolean;
}

export function RenameModal({
  isOpen,
  onClose,
  onSave,
  currentTitle,
  isLoading = false,
}: RenameModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === '') return;

    await onSave(trimmedTitle);
  }, [title, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Enter' && !isLoading && title.trim() !== '') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, title, handleSave, onClose]);

  const isSaveDisabled = title.trim() === '' || isLoading;

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="md" zIndex="modalHighest">
      <ModalHeader title="Rename Chat" onClose={onClose} />

      <div className="p-4">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter chat title"
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-border p-4 dark:border-border-dark">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
          className={cancelButtonClass}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaveDisabled}
          isLoading={isLoading}
        >
          Save
        </Button>
      </div>
    </BaseModal>
  );
}
