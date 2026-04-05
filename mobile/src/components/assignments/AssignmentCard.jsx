import { StyleSheet, Text } from 'react-native'
import AppCard from '../common/AppCard'
import StatusBadge from '../common/StatusBadge'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const AssignmentCard = ({ item }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleString() : 'Due date unavailable'

  return (
    <AppCard>
      <Text style={[styles.title, { color: palette.text }]}>{item.title || 'Assignment'}</Text>
      <Text style={[styles.meta, { color: palette.textMuted }]}>{item.subject?.name || item.subjectName || 'Subject unavailable'}</Text>
      <Text style={[styles.meta, { color: palette.textMuted }]}>Due: {dueDate}</Text>
      <StatusBadge label={item.status || 'ACTIVE'} tone={item.status === 'SUBMITTED' ? 'success' : 'default'} />
    </AppCard>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6
  },
  meta: {
    fontSize: 13,
    marginBottom: 4
  }
})

export default AssignmentCard
