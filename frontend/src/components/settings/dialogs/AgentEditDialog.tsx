import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { BaseModal } from '@/components/ui/shared/BaseModal';
import { ModalHeader } from '@/components/ui/shared/ModalHeader';
import { Button } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import type { CustomAgent } from '@/types/user.types';

interface AgentEditDialogProps {
  isOpen: boolean;
  agent: CustomAgent | null;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
}

export const AgentEditDialog: React.FC<AgentEditDialogProps> = ({
  isOpen,
  agent,
  error,
  saving,
  onClose,
  onSave,
}) => {
  const [editedContent, setEditedContent] = useState('');
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    if (agent) {
      setEditedContent(agent.content);
    }
  }, [agent]);

  const handleSave = async () => {
    if (!editedContent.trim()) {
      return;
    }
    await onSave(editedContent);
  };

  const handleClose = () => {
    setEditedContent('');
    onClose();
  };

  if (!isOpen || !agent) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalHeader title={`Edit Agent: ${agent.name}`} onClose={handleClose} />
      <div className="h-[600px] p-4">
        <Editor
          height="100%"
          language="markdown"
          value={editedContent}
          onChange={(value) => setEditedContent(value || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            automaticLayout: true,
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          loading={
            <div className="flex h-full items-center justify-center text-text-secondary dark:text-text-dark-secondary">
              Loading editor...
            </div>
          }
        />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <div className="rounded-md border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
            <p className="text-xs text-error-700 dark:text-error-400">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border p-4 dark:border-border-dark">
        <Button onClick={handleClose} variant="outline" disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          isLoading={saving}
          disabled={!editedContent.trim()}
        >
          Save Changes
        </Button>
      </div>
    </BaseModal>
  );
};
