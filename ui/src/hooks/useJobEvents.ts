import { useState, useEffect } from 'react'
import { getJobEvents } from '../api/jobs'
import type { JobEvent } from '../api/jobs'

interface UseJobEventsResult {
  events: JobEvent[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useJobEvents(jobId: string): UseJobEventsResult {
  const [events, setEvents] = useState<JobEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJobEvents(jobId)
      setEvents(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch job events'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (jobId) {
      fetchEvents()
    }
  }, [jobId])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  }
}

