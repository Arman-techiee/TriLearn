import { StyleSheet, Text, View } from 'react-native'
import AppCard from '../common/AppCard'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const AttendanceSummary = ({ total = 0, present = 0, absent = 0 }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <AppCard>
      <Text style={[styles.heading, { color: palette.text }]}>Attendance Overview</Text>
      <View style={styles.grid}>
        <View>
          <Text style={[styles.value, { color: palette.text }]}>{total}</Text>
          <Text style={[styles.label, { color: palette.textMuted }]}>Total</Text>
        </View>
        <View>
          <Text style={[styles.value, { color: palette.success }]}>{present}</Text>
          <Text style={[styles.label, { color: palette.textMuted }]}>Present</Text>
        </View>
        <View>
          <Text style={[styles.value, { color: palette.danger }]}>{absent}</Text>
          <Text style={[styles.label, { color: palette.textMuted }]}>Absent</Text>
        </View>
      </View>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  value: {
    fontSize: 28,
    fontWeight: '800'
  },
  label: {
    marginTop: 4,
    fontSize: 13
  }
})

export default AttendanceSummary
