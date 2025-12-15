import { apiClient } from '@/lib/api';
import { buildQueryString, withAuth } from '@/services/base';
import type { Model } from '@/types';

async function getModels(activeOnly: boolean = true): Promise<Model[]> {
  return withAuth(async () => {
    const queryString = buildQueryString({ active_only: activeOnly });
    const response = await apiClient.get<Model[]>(`/models/${queryString}`);
    return response ?? [];
  });
}

export const modelService = {
  getModels,
};
