'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuth, getAuthToken } from './api-client'
import { TOKEN_EXPIRY_KEY } from './config'

const ACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const CHECK_INTERVAL = 60 * 1000 // Check every minute

/**
 * Custom hook for managing auth session with:
 * - Auto-logout on token expiration
 * - Auto-logout on 30 minutes of inactivity
 * - Activity tracking on user interactions
 */
export function useAuthSession() {
  const router = useRouter()
  const lastActivityRef = useRef<number>(Date.now())
  const checkIntervalRef = useRef<NodeJS.Timeout>()

  // Track user activity
  const updateActivity = () => {
    lastActivityRef.current = Date.now()
  }

  // Check session validity
  const checkSession = () => {
    const token = getAuthToken()
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
    const now = Date.now()

    // Check token expiration
    if (!token || (expiryStr && now > parseInt(expiryStr))) {
      handleLogout('Your session has expired. Please log in again.')
      return
    }

    // Check activity timeout
    const timeSinceActivity = now - lastActivityRef.current
    if (timeSinceActivity > ACTIVITY_TIMEOUT) {
      handleLogout('You have been logged out due to inactivity.')
      return
    }
  }

  // Handle logout
  const handleLogout = (message?: string) => {
    clearAuth()
    if (message) {
      // Store message in sessionStorage to display after redirect
      sessionStorage.setItem('logout_message', message)
    }
    router.push('/login')
  }

  useEffect(() => {
    // Activity event listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    // Start session check interval
    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL)

    // Initial check
    checkSession()

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [router])

  return { updateActivity }
}
