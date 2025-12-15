import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { modelService } from '@/services/modelService';
import type { Model } from '@/types';
import { useModelStore } from '@/store';
import { queryKeys } from './queryKeys';

export const useModelsQuery = (
  activeOnly: boolean = true,
  options?: Partial<UseQueryOptions<Model[]>>,
) => {
  return useQuery({
    queryKey: [queryKeys.models, activeOnly],
    queryFn: () => modelService.getModels(activeOnly),
    ...options,
  });
};

export const useModelSelection = (options?: { enabled?: boolean }) => {
  const { data: models = [], isLoading } = useModelsQuery(true, {
    enabled: options?.enabled,
  });
  const selectedModelId = useModelStore((state) => state.selectedModelId);
  const selectModel = useModelStore((state) => state.selectModel);

  useEffect(() => {
    if (models.length === 0) return;
    const selectedExists = models.some((m) => m.model_id === selectedModelId);
    if (!selectedExists) {
      selectModel(models[0].model_id);
    }
  }, [models, selectedModelId, selectModel]);

  const selectedModel = useMemo(
    () => models.find((m) => m.model_id === selectedModelId) ?? null,
    [models, selectedModelId],
  );

  return { models, selectedModelId, selectedModel, selectModel, isLoading };
};
