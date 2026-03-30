import { useState, useEffect } from 'react'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'

const Attendance = () => {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [manualList, setManualList] = useState([])
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    fetchSubjects()
    fetchStudents()
  }, [])

  useEffect(() => {
    if (selectedSubject) fetchAttendance()
  }, [selectedSubject])

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects')
      setSubjects(res.data.subjects)
    } catch (error) { console.error(error) }
  }

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/users?role=STUDENT')
      setStudents(res.data.users)
    } catch (error) { console.error(error) }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/attendance/subject/${selectedSubject}`)
      setAttendance(res.data.attendance)
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const generateQR = async () => {
    if (!selectedSubject) return setError('Please select a subject first')
    try {
      const res = await api.post('/attendance/generate-qr', { subjectId: selectedSubject })
      setQrCode(res.data.qrCode)
      setSuccess('QR Code generated! Valid for 10 minutes')
      setTimeout(() => { setQrCode(null); setSuccess('') }, 10 * 60 * 1000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleManualAttendance = async () => {
    if (!selectedSubject || manualList.length === 0) return
    try {
      await api.post('/attendance/manual', {
        subjectId: selectedSubject,
        attendanceList: manualList
      })
      setSuccess('Attendance marked successfully!')
      setShowManual(false)
      setManualList([])
      fetchAttendance()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const toggleStudentStatus = (studentId, status) => {
    setManualList(prev => {
      const existing = prev.find(s => s.studentId === studentId)
      if (existing) {
        return prev.map(s => s.studentId === studentId ? { ...s, status } : s)
      }
      return [...prev, { studentId, status }]
    })
  }

  const getStudentStatus = (studentId) => {
    return manualList.find(s => s.studentId === studentId)?.status || 'PRESENT'
  }

  return (
    <InstructorLayout>
      <div className="p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">Generate QR codes and manage attendance</p>
        </div>

        {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Subject Select */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setQrCode(null) }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} - {s.code}</option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">QR Attendance</h2>
              <p className="text-sm text-gray-500 mb-4">
                Generate a QR code for students to scan and mark their attendance automatically.
              </p>
              <button onClick={generateQR}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium mb-4">
                🔲 Generate QR Code
              </button>
              {qrCode && (
                <div className="text-center">
                  <img src={qrCode} alt="QR Code" className="mx-auto rounded-xl border" style={{ width: 200 }} />
                  <p className="text-xs text-orange-500 mt-2">⏱ Expires in 10 minutes</p>
                </div>
              )}
            </div>

            {/* Manual Attendance */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Manual Attendance</h2>
              <p className="text-sm text-gray-500 mb-4">
                Manually mark attendance for each student.
              </p>
              <button onClick={() => setShowManual(!showManual)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium mb-4">
                📋 Mark Manually
              </button>
              {showManual && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{s.name}</span>
                      <div className="flex gap-2">
                        {['PRESENT', 'ABSENT', 'LATE'].map((status) => (
                          <button key={status}
                            onClick={() => toggleStudentStatus(s.student?.id, status)}
                            className={`text-xs px-2 py-1 rounded-lg transition ${
                              getStudentStatus(s.student?.id) === status
                                ? status === 'PRESENT' ? 'bg-green-500 text-white'
                                  : status === 'ABSENT' ? 'bg-red-500 text-white'
                                  : 'bg-orange-500 text-white'
                                : 'bg-gray-200 text-gray-600'}`}>
                            {status[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleManualAttendance}
                    className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition text-sm font-medium mt-2">
                    Save Attendance
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Records */}
        {selectedSubject && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Attendance Records</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {record.student?.user?.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium
                          ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                        No attendance records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </InstructorLayout>
  )
}

export default Attendance