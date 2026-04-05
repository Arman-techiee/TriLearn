import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { radius, spacing } from '../../constants/layout'

const AppButton = ({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const isSecondary = variant === 'secondary'

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: isSecondary ? palette.surface : palette.primary,
          borderColor: palette.border,
          opacity: disabled ? 0.6 : 1
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? palette.text : '#FFFFFF'} />
      ) : (
        <Text style={[styles.label, { color: isSecondary ? palette.text : '#FFFFFF' }]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2
  }
})

export default AppButton
