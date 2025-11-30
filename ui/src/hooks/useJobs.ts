import { useState, useEffect } from 'react'
import { listJobs } from '../api/jobs'
import type { JobResponse, JobStatus, ListJobsParams } from '../api/types'

interface UseJobsResult {
  jobs: JobResponse[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useJobs(params: ListJobsParams = {}): UseJobsResult {
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listJobs(params)
      setJobs(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch jobs'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [params.limit, params.offset, params.status])

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  }
}

