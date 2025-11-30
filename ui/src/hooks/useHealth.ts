import { useState, useEffect } from 'react'
import { getHealthLive, getHealthReady } from '../api/health'

interface HealthStatus {
  live: boolean
  ready: boolean
  loading: boolean
  error: string | null
}

export function useHealth(): HealthStatus {
  const [live, setLive] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      setLoading(true)
      setError(null)

      try {
        const [liveResponse, readyResponse] = await Promise.all([
          getHealthLive(),
          getHealthReady(),
        ])

        setLive(liveResponse.status === 'ok')
        setReady(readyResponse.status === 'ready')
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to check health status'
        )
        setLive(false)
        setReady(false)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()

    // Poll health every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    live,
    ready,
    loading,
    error,
  }
}

