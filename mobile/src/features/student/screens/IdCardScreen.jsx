import { useEffect } from 'react'
import { Image, StyleSheet, Text } from 'react-native'
import AppCard from '../../../components/common/AppCard'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import PageHeader from '../../../components/common/PageHeader'
import Screen from '../../../components/common/Screen'
import useApi from '../../../hooks/useApi'
import api from '../../../utils/api'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'

const StudentIdCardScreen = () => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const { data, loading, error, execute } = useApi({ initialData: null })

  useEffect(() => {
    void execute((signal) => api.get('/auth/student-id-qr', { signal }))
  }, [])

  return (
    <Screen>
      <PageHeader title="Student ID QR" subtitle="Present this ID card for campus verification flows." />
      {loading ? <LoadingSpinner /> : null}
      <AppCard style={styles.card}>
        {data?.qrCode ? <Image source={{ uri: data.qrCode }} style={styles.qr} /> : null}
        <Text style={[styles.caption, { color: error ? palette.danger : palette.textMuted }]}>{error || 'Use this ID QR when gatekeepers or staff request your digital card.'}</Text>
      </AppCard>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 16
  },
  qr: {
    width: 240,
    height: 240
  },
  caption: {
    fontSize: 14,
    textAlign: 'center'
  }
})

export default StudentIdCardScreen
