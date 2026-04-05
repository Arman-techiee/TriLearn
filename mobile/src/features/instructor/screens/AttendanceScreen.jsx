import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import AppButton from '../../../components/common/AppButton'
import AppCard from '../../../components/common/AppCard'
import PageHeader from '../../../components/common/PageHeader'
import Screen from '../../../components/common/Screen'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import useApi from '../../../hooks/useApi'
import api from '../../../utils/api'
import { useTheme } from '../../../context/ThemeContext'
import colors from '../../../constants/colors'

const InstructorAttendanceScreen = () => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]
  const { data, loading, execute } = useApi({ initialData: [] })
  const [qrResponse, setQrResponse] = useState(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [roster, setRoster] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void execute((signal) => api.get('/subjects', { signal }), {
      transform: (response) => response.data?.subjects || response.data || []
    })
  }, [])

  const attendanceDate = new Date().toISOString().slice(0, 10)

  const handleGenerateQr = async (subjectId) => {
    try {
      const response = await api.post('/attendance/generate-qr', { subjectId })
      setQrResponse(response.data)
      Alert.alert('QR generated', response.data?.message || 'Attendance QR generated.')
    } catch {
      Alert.alert('Unable to generate QR', 'Please try again after assigning the subject correctly.')
    }
  }

  const handleLoadRoster = async (subjectId) => {
    try {
      const response = await api.get(`/attendance/subject/${subjectId}/roster`, {
        params: { date: attendanceDate }
      })
      setSelectedSubjectId(subjectId)
      setRoster(response.data?.roster || [])
    } catch (error) {
      Alert.alert('Unable to load roster', error?.response?.data?.message || 'Please try again.')
    }
  }

  const updateRosterStatus = (studentId, status) => {
    setRoster((current) => current.map((student) => (
      student.id === studentId ? { ...student, status } : student
    )))
  }

  const handleSubmitManualAttendance = async () => {
    if (!selectedSubjectId || roster.length === 0) {
      return
    }

    setSubmitting(true)

    try {
      const subject = data.find((item) => item.id === selectedSubjectId)
      const firstStudent = roster[0]
      await api.post('/attendance/manual', {
        subjectId: selectedSubjectId,
        attendanceDate,
        semester: firstStudent?.semester,
        section: firstStudent?.section || undefined,
        attendanceList: roster.map((student) => ({
          studentId: student.id,
          status: student.status || 'PRESENT'
        }))
      })
      Alert.alert('Attendance saved', `Manual attendance submitted for ${subject?.name || 'the selected subject'}.`)
    } catch (error) {
      Alert.alert('Save failed', error?.response?.data?.message || 'Unable to save manual attendance.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <PageHeader title="Attendance Control" subtitle="Generate a live QR and manage subject attendance." />
      {loading ? <LoadingSpinner /> : null}
      {data.map((subject) => (
        <AppCard key={subject.id}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>{subject.name}</Text>
          <Text style={{ marginTop: 6, color: palette.textMuted }}>{subject.code || 'No code available'}</Text>
          <View style={styles.actionRow}>
            <AppButton title="Generate QR" onPress={() => handleGenerateQr(subject.id)} style={styles.actionButton} />
            <AppButton title="Load Roster" variant="secondary" onPress={() => handleLoadRoster(subject.id)} style={styles.actionButton} />
          </View>
        </AppCard>
      ))}
      {qrResponse?.qrCode ? (
        <AppCard>
          <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>Latest QR Session</Text>
          <Text style={{ marginTop: 8, color: palette.textMuted }}>{qrResponse.expiresIn || 'Short-lived session'}</Text>
        </AppCard>
      ) : null}
      {roster.length > 0 ? (
        <AppCard>
          <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>Manual Attendance</Text>
          <Text style={{ marginTop: 8, color: palette.textMuted }}>Date: {attendanceDate}</Text>
          {roster.map((student) => (
            <View key={student.id} style={styles.rosterCard}>
              <Text style={{ color: palette.text, fontWeight: '700' }}>{student.name}</Text>
              <Text style={{ color: palette.textMuted, marginTop: 4 }}>{student.rollNumber || 'No roll number'}</Text>
              <View style={styles.statusRow}>
                <AppButton title="Present" onPress={() => updateRosterStatus(student.id, 'PRESENT')} style={styles.statusButton} />
                <AppButton title="Absent" variant="secondary" onPress={() => updateRosterStatus(student.id, 'ABSENT')} style={styles.statusButton} />
                <AppButton title="Late" variant="secondary" onPress={() => updateRosterStatus(student.id, 'LATE')} style={styles.statusButton} />
              </View>
              <Text style={{ color: palette.textMuted, marginTop: 6 }}>Current: {student.status || 'PRESENT'}</Text>
            </View>
          ))}
          <AppButton title="Submit Manual Attendance" onPress={handleSubmitManualAttendance} loading={submitting} />
        </AppCard>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  actionButton: {
    flex: 1
  },
  rosterCard: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#90A4BA'
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  statusButton: {
    flex: 1,
    minHeight: 42
  }
})

export default InstructorAttendanceScreen
