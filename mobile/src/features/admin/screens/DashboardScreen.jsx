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

const AdminDashboardScreen = () => {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const { data, loading, execute } = useApi({ initialData: null })

  useEffect(() => {
    void execute((signal) => api.get('/admin/stats', { signal }))
  }, [])

  const stats = [
    { label: 'Users', value: data?.totalUsers ?? '-' },
    { label: 'Students', value: data?.totalStudents ?? '-' },
    { label: 'Departments', value: data?.totalDepartments ?? '-' }
  ]

  return (
    <Screen>
      <PageHeader title="Admin Dashboard" subtitle="Institution-wide visibility from mobile." />
      {loading ? <LoadingSpinner /> : null}
      <RoleOverview user={user} stats={stats} />
      <AppCard>
        <Text style={{ color: palette.text }}>Use the tabs to inspect users, departments, subjects, notices, and routine data.</Text>
      </AppCard>
    </Screen>
  )
}

export default AdminDashboardScreen
