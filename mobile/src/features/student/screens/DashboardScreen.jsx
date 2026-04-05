import { useEffect } from 'react'
import { Text } from 'react-native'
import AppCard from '../../../components/common/AppCard'
import PageHeader from '../../../components/common/PageHeader'
import RoleOverview from '../../../components/common/RoleOverview'
import Screen from '../../../components/common/Screen'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import useApi from '../../../hooks/useApi'
import api from '../../../utils/api'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'

const StudentDashboardScreen = () => {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const { data, loading, error, execute } = useApi({ initialData: null })

  useEffect(() => {
    void execute((signal) => api.get('/auth/me', { signal }))
  }, [])

  const student = data?.user?.student
  const stats = [
    { label: 'Semester', value: student?.semester ?? '-' },
    { label: 'Section', value: student?.section || '-' },
    { label: 'Department', value: student?.department || '-' }
  ]

  return (
    <Screen>
      <PageHeader title="Student Dashboard" subtitle="Your mobile overview for attendance, academics, and notices." />
      {loading ? <LoadingSpinner /> : null}
      <RoleOverview user={user} stats={stats} />
      <AppCard>
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>Profile Snapshot</Text>
        <Text style={{ color: palette.textMuted, marginTop: 8 }}>{error || 'Your student profile is synced from the main backend and available for quick reference here.'}</Text>
      </AppCard>
    </Screen>
  )
}

export default StudentDashboardScreen
