const AUTH_USER_STORAGE_KEY = 'trilearn.auth.user'
const AUTH_USER_PERSISTED_FIELDS = ['name', 'role', 'mustChangePassword', 'profileCompleted']

const buildStoredUserSnapshot = (user) => {
  if (!user || typeof user !== 'object') {
    return null
  }

  return AUTH_USER_PERSISTED_FIELDS.reduce((snapshot, field) => {
    if (Object.prototype.hasOwnProperty.call(user, field) && user[field] != null) {
      snapshot[field] = user[field]
    }

    return snapshot
  }, {})
}

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const serializedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
    return serializedUser ? buildStoredUserSnapshot(JSON.parse(serializedUser)) : null
  } catch {
    return null
  }
}

const writeStoredUser = (user) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (user) {
      const storedUserSnapshot = buildStoredUserSnapshot(user)

      if (storedUserSnapshot && Object.keys(storedUserSnapshot).length > 0) {
        window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(storedUserSnapshot))
      } else {
        window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
      }
    } else {
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures so auth remains functional in restricted environments.
  }
}

let authState = {
  token: null,
  user: readStoredUser()
}

const authSubscribers = new Set()

const notifyAuthSubscribers = () => {
  const snapshot = { ...authState }
  authSubscribers.forEach((listener) => listener(snapshot))
}

export const getAuthState = () => ({ ...authState })

export const subscribeToAuthState = (listener) => {
  authSubscribers.add(listener)
  return () => {
    authSubscribers.delete(listener)
  }
}

export const hasSessionHint = () => {
  return Boolean(authState.token || authState.user)
}

export const setAuthState = ({ token = null, user = null } = {}) => {
  authState = { token, user }
  writeStoredUser(user)
  notifyAuthSubscribers()
}

export const clearAuthState = () => {
  setAuthState({ token: null, user: null })
}
