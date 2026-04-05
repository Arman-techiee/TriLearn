import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearAuthState, getAuthState, refreshSession, setAuthState, subscribeToAuthState } from '../utils/api'
import {
  deleteRefreshToken,
  getRefreshToken,
  hasSessionHint,
  saveRefreshToken
} from '../utils/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getAuthState().user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const unsubscribe = subscribeToAuthState((nextState) => {
      if (mounted) {
        setUser(nextState.user || null)
      }
    })

    const bootstrap = async () => {
      try {
        const hintedSession = await hasSessionHint()

        if (!hintedSession) {
          return
        }

        const session = await refreshSession()

        if (mounted) {
          setUser(session.user || null)
        }
      } catch {
        await deleteRefreshToken()
        await clearAuthState()
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const login = async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password }, {
      headers: {
        'X-Client-Type': 'mobile'
      }
    })

    if (response.data?.refreshToken) {
      await saveRefreshToken(response.data.refreshToken)
    }

    await setAuthState({
      token: response.data?.token || null,
      user: response.data?.user || null
    })
    return response.data
  }

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken()
      await api.post('/auth/logout', { refreshToken })
    } catch {
      // Ignore logout request failures on mobile.
    } finally {
      await deleteRefreshToken()
      await clearAuthState()
    }
  }

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
