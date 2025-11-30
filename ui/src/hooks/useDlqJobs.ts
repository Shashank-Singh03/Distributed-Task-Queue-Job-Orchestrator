import { useState, useEffect } from 'react'
import { listJobs } from '../api/jobs'
import { JobStatus } from '../api/types'
import type { JobResponse } from '../api/types'

interface UseDlqJobsResult {
  jobs: JobResponse[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// TODO: Replace with dedicated DLQ endpoint when backend implements GET /jobs/dlq
export function useDlqJobs(): UseDlqJobsResult {
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDlqJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      // For now, filter by DEAD_LETTERED status
      // TODO: Replace with dedicated endpoint: GET /jobs/dlq
      const data = await listJobs({
        status: JobStatus.DEAD_LETTERED,
        limit: 1000, // Get all DLQ jobs
      })
      setJobs(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch DLQ jobs'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDlqJobs()
  }, [])

  return {
    jobs,
    loading,
    error,
    refetch: fetchDlqJobs,
  }
}

