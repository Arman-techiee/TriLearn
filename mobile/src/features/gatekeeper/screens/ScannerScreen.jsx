import { useEffect, useState } from 'react'
import { Alert, Text } from 'react-native'
import { Camera } from 'expo-camera'
import AppCard from '../../../components/common/AppCard'
import AppButton from '../../../components/common/AppButton'
import PageHeader from '../../../components/common/PageHeader'
import Screen from '../../../components/common/Screen'
import QrScannerModal from '../../../components/attendance/QrScannerModal'
import api from '../../../utils/api'
import { getFriendlyErrorMessage } from '../../../utils/errors'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'

const GatekeeperScannerScreen = () => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const [scannerVisible, setScannerVisible] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    void Camera.requestCameraPermissionsAsync()
  }, [])

  const handleScan = async ({ data }) => {
    try {
      const response = await api.post('/attendance/scan-student-id', { qrData: data })
      setResult(response.data)
      Alert.alert('Student scanned', response.data?.message || 'Student attendance recorded.')
    } catch (error) {
      Alert.alert('Scan failed', getFriendlyErrorMessage(error))
    } finally {
      setScannerVisible(false)
    }
  }

  return (
    <>
      <Screen>
        <PageHeader title="Gatekeeper Scanner" subtitle="Scan student ID cards for gate attendance." />
        <AppButton title="Start Scanning" onPress={() => setScannerVisible(true)} />
        {result ? (
          <AppCard>
            <Text style={{ color: palette.text }}>{result.message}</Text>
            <Text style={{ color: palette.textMuted, marginTop: 6 }}>{result.student?.name || 'Student'}</Text>
            <Text style={{ color: palette.textMuted, marginTop: 4 }}>{result.student?.rollNumber || 'Roll number unavailable'}</Text>
          </AppCard>
        ) : null}
      </Screen>
      <QrScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScan={handleScan} />
    </>
  )
}

export default GatekeeperScannerScreen
