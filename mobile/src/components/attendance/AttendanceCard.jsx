import { StyleSheet, Text, View } from 'react-native'
import AppCard from '../common/AppCard'
import StatusBadge from '../common/StatusBadge'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const AttendanceCard = ({ item }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const status = String(item.status || 'UNKNOWN').toUpperCase()
  const tone = status === 'PRESENT' ? 'success' : status === 'ABSENT' ? 'danger' : 'warning'

  return (
    <AppCard>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.text }]}>{item.subject?.name || item.title || 'Attendance record'}</Text>
          <Text style={[styles.meta, { color: palette.textMuted }]}>{item.date ? new Date(item.date).toLocaleDateString() : 'Date unavailable'}</Text>
        </View>
        <StatusBadge label={status} tone={tone} />
      </View>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  copy: {
    flex: 1,
    gap: 6
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  meta: {
    fontSize: 13
  }
})

export default AttendanceCard
