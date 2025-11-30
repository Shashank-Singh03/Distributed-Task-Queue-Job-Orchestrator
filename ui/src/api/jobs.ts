import { apiClient } from './client'
import type {
  JobResponse,
  JobCreateRequest,
  ListJobsParams,
} from './types'

export async function listJobs(params: ListJobsParams = {}): Promise<JobResponse[]> {
  const { limit = 50, offset = 0, status } = params

  const searchParams = new URLSearchParams()
  searchParams.set('limit', limit.toString())
  searchParams.set('offset', offset.toString())

  if (status) {
    const statusArray = Array.isArray(status) ? status : [status]
    statusArray.forEach((s) => {
      searchParams.append('status', s)
    })
  }

  return apiClient.get<JobResponse[]>(`/jobs?${searchParams.toString()}`)
}

export async function getJob(jobId: string): Promise<JobResponse> {
  return apiClient.get<JobResponse>(`/jobs/${jobId}`)
}

export async function createJob(request: JobCreateRequest): Promise<JobResponse> {
  return apiClient.post<JobResponse>('/jobs', request)
}

export async function cancelJob(jobId: string): Promise<JobResponse> {
  return apiClient.post<JobResponse>(`/jobs/${jobId}/cancel`)
}

export async function getJobEvents(jobId: string): Promise<JobEvent[]> {
  return apiClient.get<JobEvent[]>(`/jobs/${jobId}/events`)
}

export async function transitionJob(
  jobId: string,
  toStatus: string,
  reason?: string
): Promise<JobResponse> {
  return apiClient.post<JobResponse>(`/jobs/${jobId}/transition`, {
    to_status: toStatus,
    reason,
  })
}

// Re-export types for convenience
export type { JobCreateRequest, JobResponse }

export interface JobEvent {
  job_id: string
  event_type: string
  status: string
  timestamp: string
  details?: string
}
