import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const PageHeader = ({ title, subtitle, right }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  }
})

export default PageHeader
