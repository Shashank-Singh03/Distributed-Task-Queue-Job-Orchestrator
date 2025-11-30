import { useState, useEffect } from 'react'
import { getMetrics } from '../api/metrics'
import type { MetricsResponse } from '../api/types'

interface UseMetricsResult {
  data: MetricsResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useMetrics(): UseMetricsResult {
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const metrics = await getMetrics()
      setData(metrics)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch metrics'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  }
}

