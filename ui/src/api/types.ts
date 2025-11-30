// TypeScript types aligned with backend Pydantic models

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  DEAD_LETTERED = 'DEAD_LETTERED',
}

export interface JobPayload {
  task_type: string
  data: Record<string, unknown>
}

export interface JobResponse {
  job_id: string
  status: JobStatus
  created_at: string
  updated_at: string
  payload: JobPayload
  attempts: number
  partition_key?: string | null
  result?: Record<string, unknown> | null
}

export interface JobCreateRequest {
  payload: JobPayload
  partition_key?: string | null
}

export interface MetricsResponse {
  job_counts: {
    PENDING: number
    RUNNING: number
    SUCCEEDED: number
    FAILED: number
    DEAD_LETTERED: number
    CANCELLED?: number
  }
  dlq_depth: number
  total_jobs: number
}

export interface HealthResponse {
  status: string
}

export interface ListJobsParams {
  limit?: number
  offset?: number
  status?: JobStatus | JobStatus[]
}

