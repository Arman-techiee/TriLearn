import { StyleSheet, Text, View } from 'react-native'
import AppCard from './AppCard'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { ROLE_LABELS } from '../../constants/roles'

const RoleOverview = ({ user, stats = [] }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <AppCard>
      <Text style={[styles.welcome, { color: palette.text }]}>Welcome back, {user?.name || 'User'}</Text>
      <Text style={[styles.role, { color: palette.textMuted }]}>{ROLE_LABELS[user?.role] || 'TriLearn Member'}</Text>
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={[styles.value, { color: palette.primary }]}>{stat.value}</Text>
            <Text style={[styles.label, { color: palette.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 22,
    fontWeight: '800'
  },
  role: {
    marginTop: 6,
    fontSize: 14
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    gap: 16
  },
  stat: {
    minWidth: 86
  },
  value: {
    fontSize: 24,
    fontWeight: '800'
  },
  label: {
    marginTop: 4,
    fontSize: 12
  }
})

export default RoleOverview
