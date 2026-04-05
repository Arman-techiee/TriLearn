import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import AppButton from '../../../components/common/AppButton'
import AppCard from '../../../components/common/AppCard'
import AppInput from '../../../components/common/AppInput'
import ErrorMessage from '../../../components/common/ErrorMessage'
import Screen from '../../../components/common/Screen'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'
import { getFriendlyErrorMessage } from '../../../utils/errors'

const LoginScreen = () => {
  const { login } = useAuth()
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const router = useRouter()
  const [values, setValues] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!values.email.trim() || !values.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(values)
    } catch (submitError) {
      setError(getFriendlyErrorMessage(submitError, 'Unable to sign in right now.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <View style={styles.hero}>
          <View style={[styles.brandBadge, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
            <Text style={[styles.brand, { color: palette.primary }]}>TriLearn</Text>
          </View>
          <Text style={[styles.heading, { color: palette.text }]}>Professional campus operations, now in your pocket</Text>
          <Text style={[styles.subheading, { color: palette.textMuted }]}>
            Sign in to access attendance, notices, marks, requests, and role-specific workflows from a cleaner mobile workspace.
          </Text>
        </View>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Welcome back</Text>
            <Text style={[styles.cardText, { color: palette.textMuted }]}>
              Continue with your TriLearn account.
            </Text>
          </View>

          <AppInput
            label="Email"
            value={values.email}
            onChangeText={(email) => setValues((current) => ({ ...current, email }))}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="name@college.edu"
          />
          <AppInput
            label="Password"
            value={values.password}
            onChangeText={(password) => setValues((current) => ({ ...current, password }))}
            secureTextEntry
            placeholder="Enter password"
          />
          <ErrorMessage message={error} />
          <AppButton title="Sign In" onPress={handleSubmit} loading={loading} />
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={[styles.link, { color: palette.primary }]}>Forgot password?</Text>
          </Pressable>
        </AppCard>

        <View style={[styles.footer, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.footerTitle, { color: palette.text }]}>Built for daily engagement</Text>
          <Text style={[styles.footerText, { color: palette.textMuted }]}>
            Students, instructors, gatekeepers, coordinators, and admins now share one mobile-ready operational layer.
          </Text>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 18
  },
  hero: {
    gap: 12
  },
  brandBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40
  },
  subheading: {
    fontSize: 15,
    lineHeight: 23
  },
  card: {
    gap: 16,
    paddingVertical: 24
  },
  cardHeader: {
    gap: 4
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800'
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20
  },
  link: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700'
  },
  footer: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 4
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19
  }
})

export default LoginScreen
