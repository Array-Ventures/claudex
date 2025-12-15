import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { isSupportedUploadedFile, isUploadedImageFile } from '@/utils/fileTypes';

interface UseFileHandlingOptions {
  initialFiles?: File[] | null;
  onChange?: (files: File[]) => void;
}

export function useFileHandling({ initialFiles = null, onChange }: UseFileHandlingOptions = {}) {
  const [files, setFiles] = useState<File[]>(initialFiles || []);
  const urlsToCleanupRef = useRef<string[]>([]);

  useEffect(() => {
    setFiles(initialFiles || []);
  }, [initialFiles]);

  const previewUrls = useMemo(() => {
    if (files.length === 0) {
      return [];
    }

    const urls = files.map((file) => {
      if (isUploadedImageFile(file)) {
        try {
          const url = URL.createObjectURL(file);
          return url;
        } catch (error) {
          logger.error('Object URL creation failed', 'useFileHandling', error);
          return '';
        }
      }
      return '';
    });

    return urls;
  }, [files]);

  useEffect(() => {
    const currentUrls = previewUrls.filter((url) => url !== '');
    urlsToCleanupRef.current = currentUrls;

    return () => {
      currentUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const supportedFiles = newFiles.filter(isSupportedUploadedFile);
      if (supportedFiles.length > 0) {
        setFiles((current) => {
          const updated = [...current, ...supportedFiles];
          onChange?.(updated);
          return updated;
        });
      }
      return supportedFiles.length;
    },
    [onChange],
  );

  const setFileList = useCallback(
    (newFiles: File[]) => {
      const supportedFiles = newFiles.filter(isSupportedUploadedFile);
      setFiles(supportedFiles);
      onChange?.(supportedFiles);
      return supportedFiles.length;
    },
    [onChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((current) => {
        if (index >= 0 && index < current.length) {
          const updated = current.filter((_, i) => i !== index);
          onChange?.(updated);
          return updated;
        }
        return current;
      });
    },
    [onChange],
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    onChange?.([]);
  }, [onChange]);

  const replaceFile = useCallback(
    (index: number, newFile: File) => {
      if (!isSupportedUploadedFile(newFile)) {
        return;
      }
      setFiles((current) => {
        if (index >= 0 && index < current.length) {
          const updated = [...current];
          updated[index] = newFile;
          onChange?.(updated);
          return updated;
        }
        return current;
      });
    },
    [onChange],
  );

  return {
    files,
    previewUrls,
    addFiles,
    setFileList,
    removeFile,
    clearFiles,
    replaceFile,
  };
}
