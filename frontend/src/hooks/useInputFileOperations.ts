import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { convertDataUrlToUploadedFile } from '@/utils/file';
import { isSupportedUploadedFile } from '@/utils/fileTypes';

interface UseInputFileOperationsProps {
  attachedFiles?: File[] | null;
  onAttach?: (files: File[]) => void;
}

export const useInputFileOperations = ({
  attachedFiles,
  onAttach,
}: UseInputFileOperationsProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const handleFileSelect = useCallback(
    (files: File[]) => {
      if (onAttach) {
        const validFiles = files.filter(isSupportedUploadedFile);
        if (validFiles.length > 0) {
          onAttach(validFiles);
        }
      }
      setShowFileUpload(false);
    },
    [onAttach],
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (onAttach && attachedFiles) {
        const newFiles = [...attachedFiles];
        newFiles.splice(index, 1);
        onAttach(newFiles);
      }
    },
    [onAttach, attachedFiles],
  );

  const handleDrawClick = useCallback((index: number) => {
    setEditingImageIndex(index);
    setShowDrawingModal(true);
  }, []);

  const handleDrawingSave = useCallback(
    async (dataUrl: string) => {
      if (editingImageIndex === null || !attachedFiles) return;

      if (editingImageIndex >= attachedFiles.length) {
        setShowDrawingModal(false);
        setEditingImageIndex(null);
        return;
      }

      try {
        const originalFile = attachedFiles[editingImageIndex];
        const file = await convertDataUrlToUploadedFile(
          dataUrl,
          originalFile?.name || 'edited-image.png',
        );

        if (onAttach) {
          const newFiles = [...attachedFiles];
          newFiles[editingImageIndex] = file;
          onAttach(newFiles);
        }
      } catch (error) {
        logger.error('Drawing save failed', 'useInputFileOperations', error);
      } finally {
        setShowDrawingModal(false);
        setEditingImageIndex(null);
      }
    },
    [editingImageIndex, attachedFiles, onAttach],
  );

  const handleDroppedFiles = useCallback(
    (droppedFiles: File[]) => {
      if (!onAttach) return;

      const validFiles = droppedFiles.filter(isSupportedUploadedFile);

      if (validFiles.length > 0) {
        const existingFiles = attachedFiles || [];
        onAttach([...existingFiles, ...validFiles]);
      }
    },
    [onAttach, attachedFiles],
  );

  const closeDrawingModal = useCallback(() => {
    setShowDrawingModal(false);
    setEditingImageIndex(null);
  }, []);

  return {
    showFileUpload,
    setShowFileUpload,
    showDrawingModal,
    editingImageIndex,
    handleFileSelect,
    handleRemoveFile,
    handleDrawClick,
    handleDrawingSave,
    handleDroppedFiles,
    closeDrawingModal,
  };
};
