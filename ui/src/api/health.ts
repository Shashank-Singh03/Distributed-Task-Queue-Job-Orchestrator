import { apiClient } from './client'
import type { HealthResponse } from './types'

export async function getHealthLive(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health/live')
}

export async function getHealthReady(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health/ready')
}

