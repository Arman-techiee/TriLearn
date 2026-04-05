import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { radius, spacing } from '../../constants/layout'

const AppInput = ({ label, error, style, ...props }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { color: palette.text }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: palette.surface,
            borderColor: error ? palette.danger : palette.border,
            color: palette.text
          }
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    fontSize: 15
  },
  error: {
    marginTop: spacing.xs,
    fontSize: 12
  }
})

export default AppInput
