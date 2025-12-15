import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface UseCrudFormOptions<S, T, K extends keyof S> {
  createDefault: () => T;
  validateForm: (form: T, editingIndex: number | null) => string | null;
  getArrayKey: K;
  itemName: string;
}

type PersistFn<S> = (
  updater: (prev: S) => S,
  options?: { successMessage?: string; errorMessage?: string },
) => Promise<void>;

export const useCrudForm = <S, T, K extends keyof S>(
  settings: S,
  persistSettings: PersistFn<S>,
  options: UseCrudFormOptions<S, T, K>,
) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<T>(options.createDefault());
  const [formError, setFormError] = useState<string | null>(null);

  const getItems = useCallback(() => {
    return (settings[options.getArrayKey] as T[] | null | undefined) || [];
  }, [settings, options.getArrayKey]);

  const resetForm = useCallback(() => {
    setForm(options.createDefault());
    setEditingIndex(null);
    setFormError(null);
  }, [options]);

  const handleAdd = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback(
    (index: number) => {
      const items = getItems();
      const item = items[index];
      if (item) {
        setForm({ ...item });
        setEditingIndex(index);
        setFormError(null);
        setIsDialogOpen(true);
      }
    },
    [getItems],
  );

  const handleDelete = useCallback(
    (index: number) => {
      const items = getItems();
      const item = items[index];
      const targetName =
        item && typeof item === 'object' && 'name' in item
          ? (item as { name: string }).name
          : undefined;

      persistSettings(
        (prev: S) => {
          const arr = [...((prev[options.getArrayKey] as T[] | null | undefined) || [])];
          arr.splice(index, 1);
          return {
            ...prev,
            [options.getArrayKey]: arr.length > 0 ? arr : null,
          } as S;
        },
        {
          successMessage: targetName ? `Deleted ${targetName}` : `${options.itemName} deleted`,
          errorMessage: `Failed to delete ${options.itemName}`,
        },
      ).catch((error) => {
        logger.error(`Failed to delete ${options.itemName}`, 'useCrudForm', error);
      });
    },
    [getItems, persistSettings, options],
  );

  const handleToggleEnabled = useCallback(
    (index: number, enabled: boolean) => {
      persistSettings(
        (prev: S) => {
          const arr = [...((prev[options.getArrayKey] as T[] | null | undefined) || [])];
          if (arr[index]) {
            arr[index] = { ...arr[index], enabled };
          }
          return { ...prev, [options.getArrayKey]: arr } as S;
        },
        { errorMessage: `Failed to update ${options.itemName} state` },
      ).catch((error) => {
        logger.error(`Failed to toggle ${options.itemName}`, 'useCrudForm', error);
      });
    },
    [persistSettings, options],
  );

  const handleFormChange = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    const validationError = options.validateForm(form, editingIndex);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await persistSettings(
        (prev: S) => {
          const nextItems = [...((prev[options.getArrayKey] as T[] | null | undefined) || [])];
          if (editingIndex !== null) {
            nextItems[editingIndex] = form;
          } else {
            nextItems.push(form);
          }
          return { ...prev, [options.getArrayKey]: nextItems } as S;
        },
        {
          successMessage:
            editingIndex !== null ? `${options.itemName} updated` : `${options.itemName} added`,
          errorMessage: `Failed to save ${options.itemName}`,
        },
      );

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }, [form, editingIndex, persistSettings, resetForm, options]);

  return {
    isDialogOpen,
    editingIndex,
    form,
    formError,
    handleAdd,
    handleEdit,
    handleDelete,
    handleToggleEnabled,
    handleFormChange,
    handleDialogClose,
    handleSave,
  };
};
