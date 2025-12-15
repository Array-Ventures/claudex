export enum RecurrenceType {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum TaskStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ScheduledTask {
  id: string;
  user_id: string;
  task_name: string;
  prompt_message: string;
  recurrence_type: RecurrenceType;
  scheduled_time: string;
  scheduled_day: number | null;
  next_execution: string | null;
  last_execution: string | null;
  status: TaskStatus;
  enabled: boolean;
  execution_count: number;
  failure_count: number;
  max_retries: number;
  last_error: string | null;
  model_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledTaskRequest {
  task_name: string;
  prompt_message: string;
  recurrence_type: RecurrenceType;
  scheduled_time: string;
  scheduled_day?: number;
  model_id?: string;
}

export interface UpdateScheduledTaskRequest {
  task_name?: string;
  prompt_message?: string;
  recurrence_type?: RecurrenceType;
  scheduled_time?: string;
  scheduled_day?: number;
  model_id?: string;
  enabled?: boolean;
}

export interface TaskToggleResponse {
  id: string;
  enabled: boolean;
  message: string;
}
