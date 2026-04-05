import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { radius, shadows, spacing } from '../../constants/layout'

const AppCard = ({ children, style }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <View style={[styles.card, shadows.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg
  }
})

export default AppCard
