import { useState, useEffect } from 'react'
import { getJob, cancelJob } from '../api/jobs'
import type { JobResponse } from '../api/types'

interface UseJobDetailResult {
  job: JobResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
  cancel: () => Promise<void>
  cancelling: boolean
}

export function useJobDetail(jobId: string): UseJobDetailResult {
  const [job, setJob] = useState<JobResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchJob = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJob(jobId)
      setJob(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch job'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!job) return

    setCancelling(true)
    setError(null)
    try {
      await cancelJob(jobId)
      // Refetch to get updated status
      await fetchJob()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to cancel job'
      setError(message)
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    fetchJob()
  }, [jobId])

  return {
    job,
    loading,
    error,
    refetch: fetchJob,
    cancel: handleCancel,
    cancelling,
  }
}

