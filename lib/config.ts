// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/api/auth/login`,
  },
  LEADS: {
    LIST: `${API_URL}/api/leads`,
    UPDATE_STATUS: (id: string) => `${API_URL}/api/leads/${id}/status`,
    ASSIGN: (id: string) => `${API_URL}/api/leads/${id}/assign`,
  },
  USERS: {
    LIST: `${API_URL}/api/users`,
    CREATE: `${API_URL}/api/users`,
    UPDATE: (id: string) => `${API_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_URL}/api/users/${id}`,
  },
  TESTIMONIALS: {
    MODERATION: `${API_URL}/api/testimonials/moderation`,
    APPROVE: (id: string) => `${API_URL}/api/testimonials/${id}/approve`,
    REJECT: (id: string) => `${API_URL}/api/testimonials/${id}/reject`,
    DELETE: (id: string) => `${API_URL}/api/testimonials/${id}`,
  },
}

// Security Settings
export const TOKEN_KEY = 'adminToken'
export const USER_KEY = 'adminUser'
export const TOKEN_EXPIRY_KEY = 'tokenExpiry'
