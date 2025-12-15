import type { ElementType } from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import { Upload, X } from 'lucide-react';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

interface SettingsUploadModalProps {
  isOpen: boolean;
  error: string | null;
  uploading: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  title: string;
  acceptedExtension: string;
  icon: ElementType;
  hintText: string;
}

export const SettingsUploadModal = ({
  isOpen,
  error,
  uploading,
  onClose,
  onUpload,
  title,
  acceptedExtension,
  icon: Icon,
  hintText,
}: SettingsUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFilesDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (file && file.name.endsWith(acceptedExtension)) {
        setSelectedFile(file);
      }
    },
    [acceptedExtension],
  );

  const { isDragging, dragHandlers } = useDragAndDrop({
    onFilesDrop: handleFilesDrop,
    disabled: uploading,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 dark:bg-surface-dark">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="text-text-tertiary hover:text-text-primary dark:text-text-dark-tertiary dark:hover:text-text-dark-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center ${
              isDragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                : 'border-border dark:border-border-dark'
            }`}
            {...dragHandlers}
          >
            {selectedFile ? (
              <div>
                <Icon className="mx-auto mb-2 h-12 w-12 text-brand-600 dark:text-brand-400" />
                <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto mb-2 h-12 w-12 text-text-quaternary dark:text-text-dark-quaternary" />
                <p className="mb-1 text-sm text-text-primary dark:text-text-dark-primary">
                  Drop your {acceptedExtension} file here or
                </p>
                <label className="cursor-pointer text-sm text-brand-600 hover:underline dark:text-brand-400">
                  browse files
                  <input
                    type="file"
                    accept={acceptedExtension}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-surface-secondary p-3 dark:border-border-dark dark:bg-surface-dark-secondary">
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{hintText}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
            <p className="text-xs text-error-700 dark:text-error-400">{error}</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button onClick={handleClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="flex-1"
            disabled={!selectedFile || uploading}
            isLoading={uploading}
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
};
