// Generic HTTP client wrapper
// VERSION: 3.0 - FORCED REBUILD - Backend at :8000
// TIMESTAMP: 2025-11-30 16:32

const API_BASE_URL: string = 'http://localhost:8000'  // HARDCODED - NO ENV VAR

// FORCE CONSOLE LOG - MUST SEE THIS
console.log('=' .repeat(60))
console.log('🚀 API CLIENT VERSION 3.0 LOADED')
console.log('🚀 BASE URL:', API_BASE_URL)
console.log('=' .repeat(60))

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  
  console.log('[API] Calling:', url) // Debug log

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  
  console.log('[API] Response:', response.status, response.statusText) // Debug log

  if (!response.ok) {
    const text = await response.text()
    console.error('[API] Error response:', text)
    throw new Error(
      `Request failed ${response.status} ${response.statusText}`
    )
  }

  // Handle no-content responses
  if (response.status === 204) {
    return undefined as T
  }
  
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.error('[API] Not JSON response:', text.substring(0, 200))
    throw new Error(`Expected JSON but got ${contentType}`)
  }

  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

export { request }

