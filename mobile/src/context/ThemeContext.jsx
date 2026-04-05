import { Appearance } from 'react-native'
import { createContext, useContext, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const deviceTheme = Appearance.getColorScheme() || 'light'
  const [theme, setTheme] = useState('system')

  const resolvedTheme = theme === 'system' ? deviceTheme : theme

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme: () => setTheme((current) => {
      const activeTheme = current === 'system' ? deviceTheme : current
      return activeTheme === 'dark' ? 'light' : 'dark'
    })
  }), [deviceTheme, resolvedTheme, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
