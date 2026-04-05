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

const InstructorDashboardScreen = () => {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const { data, loading, execute } = useApi({ initialData: [] })

  useEffect(() => {
    void execute((signal) => api.get('/subjects', { signal }), {
      transform: (response) => response.data?.subjects || response.data || []
    })
  }, [])

  return (
    <Screen>
      <PageHeader title="Instructor Dashboard" subtitle="Teaching workload, subject access, and quick campus tools." />
      {loading ? <LoadingSpinner /> : null}
      <RoleOverview user={user} stats={[{ label: 'Subjects', value: data?.length || 0 }]} />
      <AppCard>
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>Teaching Scope</Text>
        <Text style={{ color: palette.textMuted, marginTop: 8 }}>Use the attendance, marks, assignment, and request screens to manage your daily teaching flow.</Text>
      </AppCard>
    </Screen>
  )
}

export default InstructorDashboardScreen
