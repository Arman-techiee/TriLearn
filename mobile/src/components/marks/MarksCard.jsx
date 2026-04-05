import { StyleSheet, Text, View } from 'react-native'
import AppCard from '../common/AppCard'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const MarksCard = ({ item }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <AppCard>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.text }]}>{item.subject?.name || item.subjectName || 'Subject'}</Text>
          <Text style={[styles.meta, { color: palette.textMuted }]}>{item.subject?.code || item.subjectCode || 'Code unavailable'}</Text>
        </View>
        <Text style={[styles.score, { color: palette.primary }]}>{item.marksObtained ?? item.score ?? '-'}</Text>
      </View>
    </AppCard>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  meta: {
    fontSize: 13
  },
  score: {
    fontSize: 30,
    fontWeight: '800'
  }
})

export default MarksCard
