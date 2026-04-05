import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const getBadgeColor = (palette, tone) => {
  if (tone === 'success') return palette.success
  if (tone === 'warning') return palette.warning
  if (tone === 'danger') return palette.danger
  return palette.primary
}

const StatusBadge = ({ label, tone = 'default' }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const badgeColor = getBadgeColor(palette, tone)

  return (
    <View style={[styles.badge, { backgroundColor: `${badgeColor}22`, borderColor: `${badgeColor}66` }]}>
      <Text style={[styles.label, { color: badgeColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  label: {
    fontSize: 12,
    fontWeight: '700'
  }
})

export default StatusBadge
