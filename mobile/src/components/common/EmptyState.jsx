import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const EmptyState = ({ title, description }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: palette.textMuted }]}>{description}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    textAlign: 'center'
  }
})

export default EmptyState
