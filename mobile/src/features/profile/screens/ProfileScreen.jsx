import { useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import AppButton from '../../../components/common/AppButton'
import AppCard from '../../../components/common/AppCard'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import PageHeader from '../../../components/common/PageHeader'
import Screen from '../../../components/common/Screen'
import useApi from '../../../hooks/useApi'
import api from '../../../utils/api'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'

const ProfileScreen = () => {
  const { user, logout } = useAuth()
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const { data, loading, error, execute } = useApi({ initialData: null })

  useEffect(() => {
    void execute((signal) => api.get('/auth/me', { signal }))
  }, [])

  const profile = data?.user || user

  return (
    <Screen>
      <PageHeader title="Profile" subtitle="Account details, theme preferences, and sign-out controls." />
      {loading ? <LoadingSpinner /> : null}
      <AppCard style={styles.card}>
        <Text style={[styles.name, { color: palette.text }]}>{profile?.name || 'Unknown user'}</Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>{profile?.email || 'No email available'}</Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>Role: {profile?.role || 'Unknown'}</Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>Theme: {theme} ({resolvedTheme})</Text>
        {error ? <Text style={[styles.meta, { color: palette.danger }]}>{error}</Text> : null}
      </AppCard>
      <AppButton title="Toggle Theme" variant="secondary" onPress={toggleTheme} />
      <AppButton title="Sign Out" onPress={logout} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 8
  },
  name: {
    fontSize: 24,
    fontWeight: '800'
  },
  meta: {
    fontSize: 14
  }
})

export default ProfileScreen
