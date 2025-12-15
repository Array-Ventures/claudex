import type { CustomEnvVar } from '@/types';
import { Button, Input, Label } from '@/components/ui';
import { SecretInput } from '../inputs/SecretInput';
import { useState } from 'react';
import { BaseModal } from '@/components/ui/shared/BaseModal';

interface EnvVarDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  envVar: CustomEnvVar;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  onEnvVarChange: <K extends keyof CustomEnvVar>(field: K, value: CustomEnvVar[K]) => void;
}

export const EnvVarDialog: React.FC<EnvVarDialogProps> = ({
  isOpen,
  isEditing,
  envVar,
  error,
  onClose,
  onSubmit,
  onEnvVarChange,
}) => {
  const [isValueVisible, setIsValueVisible] = useState(false);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      className="max-h-[90vh] overflow-y-auto shadow-strong"
    >
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary dark:text-text-dark-primary">
          {isEditing ? 'Edit Environment Variable' : 'Add Environment Variable'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
            <p className="text-xs text-error-700 dark:text-error-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 text-sm text-text-primary dark:text-text-dark-primary">
              Variable Name
            </Label>
            <Input
              value={envVar.key}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                onEnvVarChange('key', value);
              }}
              placeholder="OPENAI_API_KEY"
              className="font-mono text-sm"
            />
            <p className="mt-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
              Uppercase letters, numbers, and underscores only (e.g., OPENAI_API_KEY,
              GEMINI_API_KEY)
            </p>
          </div>

          <div>
            <Label className="mb-1.5 text-sm text-text-primary dark:text-text-dark-primary">
              Value
            </Label>
            <SecretInput
              value={envVar.value}
              onChange={(value) => onEnvVarChange('value', value)}
              placeholder="sk-..."
              isVisible={isValueVisible}
              onToggleVisibility={() => setIsValueVisible(!isValueVisible)}
              containerClassName="w-full"
              inputClassName="font-mono"
            />
            <p className="mt-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
              The value for this environment variable (will be available in all sandboxes)
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            variant="primary"
            size="sm"
            disabled={!envVar.key.trim() || !envVar.value.trim()}
          >
            {isEditing ? 'Update Variable' : 'Add Variable'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
