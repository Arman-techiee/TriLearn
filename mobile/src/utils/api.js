import axios from 'axios'
import Constants from 'expo-constants'
import {
  deleteRefreshToken,
  getRefreshToken,
  saveRefreshToken,
  setSessionHint
} from './storage'

const normalizeApiBaseUrl = (rawValue) => {
  const fallbackUrl = 'http://localhost:5000/api/v1'
  const trimmedValue = String(rawValue || '').trim()

  if (!trimmedValue) {
    return fallbackUrl
  }

  if (/\/api\/v\d+\/?$/i.test(trimmedValue)) {
    return trimmedValue.replace(/\/+$/, '')
  }

  if (/\/api\/?$/i.test(trimmedValue)) {
    return `${trimmedValue.replace(/\/+$/, '')}/v1`
  }

  return `${trimmedValue.replace(/\/+$/, '')}/api/v1`
}

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl

export const API_BASE_URL = normalizeApiBaseUrl(rawApiUrl)
export const API_ORIGIN = API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, '')

let authState = {
  token: null,
  user: null
}
let refreshPromise = null
const authSubscribers = new Set()

export const getAuthState = () => ({ ...authState })

export const subscribeToAuthState = (listener) => {
  authSubscribers.add(listener)
  return () => {
    authSubscribers.delete(listener)
  }
}

export const setAuthState = async ({ token = null, user = null } = {}) => {
  authState = { token, user }
  await setSessionHint(Boolean(token || user))
  authSubscribers.forEach((listener) => listener({ ...authState }))
}

export const clearAuthState = async () => {
  await setAuthState({ token: null, user: null })
}

const baseHeaders = {
  'X-Client-Type': 'mobile'
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: baseHeaders
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: baseHeaders
})

api.interceptors.request.use((config) => {
  config.headers = {
    ...baseHeaders,
    ...(config.headers || {})
  }

  if (authState.token) {
    config.headers.Authorization = `Bearer ${authState.token}`
  }

  return config
})

export const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken()

      if (!refreshToken) {
        throw new Error('Refresh token is required')
      }

      try {
        const response = await refreshClient.post('/auth/refresh', { refreshToken })
        const nextRefreshToken = response.data?.refreshToken

        if (nextRefreshToken) {
          await saveRefreshToken(nextRefreshToken)
        }

        await setAuthState({
          token: response.data?.token || null,
          user: response.data?.user || null
        })

        return response.data
      } catch (error) {
        await deleteRefreshToken()
        await clearAuthState()
        throw error
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/login') &&
      !String(originalRequest.url || '').includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        const refreshed = await refreshSession()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${refreshed.token}`
        return api(originalRequest)
      } catch (refreshError) {
        await deleteRefreshToken()
        await clearAuthState()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
