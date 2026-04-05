import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Camera } from 'expo-camera'
import AppButton from '../../../components/common/AppButton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import AttendanceSummary from '../../../components/attendance/AttendanceSummary'
import QrScannerModal from '../../../components/attendance/QrScannerModal'
import ResourceScreen from '../../../components/common/ResourceScreen'
import AttendanceCard from '../../../components/attendance/AttendanceCard'
import useApi from '../../../hooks/useApi'
import api from '../../../utils/api'
import { getFriendlyErrorMessage } from '../../../utils/errors'

const StudentAttendanceScreen = () => {
  const { data, loading, error, execute } = useApi({ initialData: [] })
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scanEnabled, setScanEnabled] = useState(true)
  const [message, setMessage] = useState('')
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 })

  useEffect(() => {
    void Camera.requestCameraPermissionsAsync()
    void execute((signal) => api.get('/attendance/my', { signal }), {
      transform: (response) => response.data?.attendance || []
    })
  }, [])

  useEffect(() => {
    const records = data || []
    setSummary({
      total: records.length,
      present: records.filter((item) => item.status === 'PRESENT').length,
      absent: records.filter((item) => item.status === 'ABSENT').length
    })
  }, [data])

  const handleScan = async ({ data: qrData }) => {
    if (!scanEnabled) {
      return
    }

    setScanEnabled(false)

    try {
      const response = await api.post('/attendance/scan-qr', { qrData })
      setMessage(response.data?.message || 'Attendance marked successfully.')
      Alert.alert('Attendance marked', response.data?.message || 'Attendance marked successfully.')
    } catch {
      try {
        const response = await api.post('/attendance/scan-daily-qr', { qrData })
        setMessage(response.data?.message || 'Daily attendance marked successfully.')
        Alert.alert('Attendance marked', response.data?.message || 'Daily attendance marked successfully.')
      } catch (dailyError) {
        const friendly = getFriendlyErrorMessage(dailyError)
        setMessage(friendly)
        Alert.alert('Scan failed', friendly)
      }
    } finally {
      setTimeout(() => setScanEnabled(true), 1500)
      setScannerVisible(false)
    }
  }

  const refresh = () => execute((signal) => api.get('/attendance/my', { signal }), {
    transform: (response) => response.data?.attendance || []
  })

  return (
    <>
      <ResourceScreen
        title="Attendance"
        subtitle="Scan a class or gate QR code and review your history."
        items={data}
        loading={loading}
        error={error}
        onRefresh={refresh}
        beforeList={(
          <>
            <AttendanceSummary {...summary} />
            <AppButton title="Open QR Scanner" onPress={() => setScannerVisible(true)} />
            <ErrorMessage message={message} />
          </>
        )}
        renderItem={({ item }) => <AttendanceCard item={item} />}
        keyExtractor={(item, index) => String(item?.id || index)}
        emptyTitle="No attendance records yet"
        emptyDescription="Attendance history will appear here after your first class scan."
      />
      <QrScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScan={handleScan} enabled={scanEnabled} />
    </>
  )
}

export default StudentAttendanceScreen
