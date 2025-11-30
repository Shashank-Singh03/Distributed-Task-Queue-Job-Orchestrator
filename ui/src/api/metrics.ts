import { apiClient } from './client'
import type { MetricsResponse } from './types'

export async function getMetrics(): Promise<MetricsResponse> {
  return apiClient.get<MetricsResponse>('/metrics')
}

