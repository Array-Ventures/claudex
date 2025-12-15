import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { schedulingService } from '@/services/schedulingService';
import type {
  ScheduledTask,
  CreateScheduledTaskRequest,
  UpdateScheduledTaskRequest,
  TaskToggleResponse,
} from '@/types';
import { queryKeys } from './queryKeys';

export const useScheduledTasksQuery = (options?: Partial<UseQueryOptions<ScheduledTask[]>>) => {
  return useQuery({
    queryKey: queryKeys.scheduling.tasks,
    queryFn: () => schedulingService.getTasks(),
    ...options,
  });
};

export const useCreateScheduledTaskMutation = (
  options?: UseMutationOptions<ScheduledTask, Error, CreateScheduledTaskRequest>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (data: CreateScheduledTaskRequest) => schedulingService.createTask(data),
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.tasks });
      if (onSuccess) {
        await onSuccess(data, variables, context, mutation);
      }
    },
    ...restOptions,
  });
};

interface UpdateScheduledTaskParams {
  taskId: string;
  data: UpdateScheduledTaskRequest;
}

export const useUpdateScheduledTaskMutation = (
  options?: UseMutationOptions<ScheduledTask, Error, UpdateScheduledTaskParams>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: ({ taskId, data }: UpdateScheduledTaskParams) =>
      schedulingService.updateTask(taskId, data),
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.task(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.tasks });
      if (onSuccess) {
        await onSuccess(data, variables, context, mutation);
      }
    },
    ...restOptions,
  });
};

export const useDeleteScheduledTaskMutation = (
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (taskId: string) => schedulingService.deleteTask(taskId),
    onSuccess: async (data, taskId, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.tasks });
      if (onSuccess) {
        await onSuccess(data, taskId, context, mutation);
      }
    },
    ...restOptions,
  });
};

export const useToggleScheduledTaskMutation = (
  options?: UseMutationOptions<TaskToggleResponse, Error, string>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (taskId: string) => schedulingService.toggleTask(taskId),
    onSuccess: async (data, taskId, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.task(taskId) });
      if (onSuccess) {
        await onSuccess(data, taskId, context, mutation);
      }
    },
    ...restOptions,
  });
};
