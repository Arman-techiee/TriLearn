import { StyleSheet, Text } from 'react-native'
import Screen from '../../../components/common/Screen'
import AppCard from '../../../components/common/AppCard'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'

const ForgotPasswordScreen = () => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <Screen>
      <AppCard>
        <Text style={[styles.title, { color: palette.text }]}>Forgot Password</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>Password reset will be handled in a follow-up mobile pass. For now, use the web app reset flow or ask an administrator to assist.</Text>
      </AppCard>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  }
})

export default ForgotPasswordScreen
