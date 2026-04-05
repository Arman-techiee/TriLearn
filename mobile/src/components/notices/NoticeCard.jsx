import { StyleSheet, Text } from 'react-native'
import AppCard from '../common/AppCard'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const NoticeCard = ({ item }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <AppCard>
      <Text style={[styles.title, { color: palette.text }]}>{item.title || 'Notice'}</Text>
      <Text style={[styles.date, { color: palette.textMuted }]}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</Text>
      <Text style={[styles.body, { color: palette.textMuted }]}>{item.content || item.message || 'No notice body provided.'}</Text>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6
  },
  date: {
    fontSize: 12,
    marginBottom: 10
  },
  body: {
    fontSize: 14,
    lineHeight: 21
  }
})

export default NoticeCard
