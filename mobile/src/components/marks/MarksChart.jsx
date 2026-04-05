import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const MAX_BAR_HEIGHT = 140

const MarksChart = ({ data = [] }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const safeData = Array.isArray(data) ? data.slice(0, 6) : []
  const maxValue = Math.max(...safeData.map((item) => Number(item.value) || 0), 0, 1)

  if (safeData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: palette.text }]}>No chart data yet</Text>
        <Text style={[styles.emptyDescription, { color: palette.textMuted }]}>
          Your latest marks will appear here once results are published.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {safeData.map((item, index) => {
          const numericValue = Number(item.value) || 0
          const barHeight = Math.max((numericValue / maxValue) * MAX_BAR_HEIGHT, 10)

          return (
            <View key={`${item.label || 'item'}-${index}`} style={styles.column}>
              <Text style={[styles.value, { color: palette.text }]}>{numericValue}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: palette.primary
                  }
                ]}
              />
              <Text style={[styles.label, { color: palette.textMuted }]}>
                {String(item.label || `S${index + 1}`).slice(0, 6)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  chart: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  value: {
    fontSize: 12,
    fontWeight: '700'
  },
  bar: {
    width: '100%',
    maxWidth: 28,
    borderRadius: 999
  },
  label: {
    fontSize: 11,
    textAlign: 'center'
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: 'center'
  }
})

export default MarksChart
