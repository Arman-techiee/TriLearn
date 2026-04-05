import { useState } from 'react'
import { Alert, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import Screen from '../../../components/common/Screen'
import AppCard from '../../../components/common/AppCard'
import AppInput from '../../../components/common/AppInput'
import ErrorMessage from '../../../components/common/ErrorMessage'
import AppButton from '../../../components/common/AppButton'
import api from '../../../utils/api'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'
import { getFriendlyErrorMessage } from '../../../utils/errors'
import { getHomeRouteForRole } from '../../../utils/auth'

const ChangePasswordScreen = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const [values, setValues] = useState({ currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/change-password', values)
      Alert.alert('Password updated', 'Your password has been changed successfully.')
      router.replace(getHomeRouteForRole(user?.role))
    } catch (submitError) {
      setError(getFriendlyErrorMessage(submitError, 'Unable to update your password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <AppCard style={styles.card}>
        <Text style={[styles.title, { color: palette.text }]}>Change Password</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>You need to set a new password before continuing in the mobile app.</Text>
        <AppInput
          label="Current password"
          value={values.currentPassword}
          onChangeText={(currentPassword) => setValues((current) => ({ ...current, currentPassword }))}
          secureTextEntry
        />
        <AppInput
          label="New password"
          value={values.newPassword}
          onChangeText={(newPassword) => setValues((current) => ({ ...current, newPassword }))}
          secureTextEntry
        />
        <ErrorMessage message={error} />
        <AppButton title="Update Password" onPress={handleSubmit} loading={loading} />
      </AppCard>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '800'
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  }
})

export default ChangePasswordScreen
