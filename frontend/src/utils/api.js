import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

const clearAuthState = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return ''

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl
  }

  return fileUrl.startsWith('/')
    ? `${API_ORIGIN}${fileUrl}`
    : `${API_ORIGIN}/${fileUrl}`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let refreshPromise = null

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login') &&
      !originalRequest?.url?.includes('/auth/refresh') &&
      !originalRequest?.url?.includes('/auth/logout')
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient.post('/auth/refresh')
            .finally(() => {
              refreshPromise = null
            })
        }

        const refreshResponse = await refreshPromise
        const { token, user } = refreshResponse.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${token}`

        return api(originalRequest)
      } catch (refreshError) {
        clearAuthState()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401) {
      clearAuthState()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
