import { TOKEN_KEY, USER_KEY, TOKEN_EXPIRY_KEY } from './config'

// Token management with expiration
export const setAuthToken = (token: string, expiresIn: string = '7d') => {
  if (typeof window === 'undefined') return

  localStorage.setItem(TOKEN_KEY, token)

  // Calculate expiry time (assuming days)
  const days = parseInt(expiresIn.replace('d', ''))
  const expiryTime = Date.now() + (days * 24 * 60 * 60 * 1000)
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

  if (!token) return null

  // Check if token is expired
  if (expiry && Date.now() > parseInt(expiry)) {
    clearAuth()
    return null
  }

  return token
}

export const setUserData = (user: any) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUserData = (): any | null => {
  if (typeof window === 'undefined') return null

  const userData = localStorage.getItem(USER_KEY)
  if (!userData) return null

  try {
    return JSON.parse(userData)
  } catch (error) {
    console.error('Failed to parse user data')
    return null
  }
}

export const clearAuth = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

// API Client with unified error handling
interface ApiOptions extends RequestInit {
  requiresAuth?: boolean
}

export class ApiError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data: any) {
    super(message)
    this.status = status
    this.data = data
    this.name = 'ApiError'
  }
}

export const apiClient = async (url: string, options: ApiOptions = {}) => {
  const { requiresAuth = true, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Add auth token if required
  if (requiresAuth) {
    const token = getAuthToken()
    if (!token) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError('No authentication token', 401, null)
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    // Handle 401 Unauthorized
    if (response.status === 401) {
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError('Unauthorized', 401, null)
    }

    // Handle other error statuses
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: 'An error occurred' }
      }
      throw new ApiError(
        errorData.message || `HTTP Error ${response.status}`,
        response.status,
        errorData
      )
    }

    // Parse response
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return response
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or other errors
    throw new ApiError(
      'Network error. Please check your connection.',
      0,
      error
    )
  }
}

// Convenience methods
export const api = {
  get: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: ApiOptions) =>
    apiClient(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: (url: string, data?: any, options?: ApiOptions) =>
    apiClient(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: 'DELETE' }),
}
