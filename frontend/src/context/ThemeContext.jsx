import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'trilearn-theme'
const LEGACY_STORAGE_KEYS = ['edunexus_theme', 'edunexus-theme']
const ThemeContext = createContext(null)

const getSystemTheme = () => (
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY)

      if (savedTheme) {
        return savedTheme
      }

      const legacyTheme = LEGACY_STORAGE_KEYS
        .map((key) => window.localStorage.getItem(key))
        .find(Boolean)

      return legacyTheme || 'system'
    } catch {
      return 'system'
    }
  })
  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme())

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemTheme(media.matches ? 'dark' : 'light')

    handleChange()
    media.addEventListener?.('change', handleChange)

    return () => {
      media.removeEventListener?.('change', handleChange)
    }
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.dataset.theme = resolvedTheme

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
      LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key))
    } catch {
      // Ignore storage failures.
    }
  }, [resolvedTheme, theme])

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme: () => setTheme((current) => {
      if (current === 'system') {
        return systemTheme === 'dark' ? 'light' : 'dark'
      }

      return current === 'dark' ? 'light' : 'dark'
    })
  }), [resolvedTheme, systemTheme, theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
