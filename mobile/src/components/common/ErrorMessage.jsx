import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const ErrorMessage = ({ message }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  if (!message) {
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: `${palette.danger}14`, borderColor: `${palette.danger}55` }]}>
      <Text style={[styles.text, { color: palette.danger }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12
  },
  text: {
    fontSize: 13,
    fontWeight: '600'
  }
})

export default ErrorMessage
