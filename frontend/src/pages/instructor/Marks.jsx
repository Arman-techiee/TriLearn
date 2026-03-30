import { useState, useEffect } from 'react'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'

const Marks = () => {
  const [subjects, setSubjects] = useState([])
  const [marks, setMarks] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    studentId: '', subjectId: '', examType: 'INTERNAL',
    totalMarks: 100, obtainedMarks: '', remarks: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSubjects()
    fetchStudents()
  }, [])

  useEffect(() => {
    if (selectedSubject) fetchMarks()
  }, [selectedSubject])

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects')
      setSubjects(res.data.subjects)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/users?role=STUDENT')
      setStudents(res.data.users)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMarks = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/marks/subject/${selectedSubject}`)
      setMarks(res.data.marks)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/marks', {
        ...form,
        totalMarks: parseInt(form.totalMarks),
        obtainedMarks: parseInt(form.obtainedMarks)
      })
      setSuccess('Marks added successfully!')
      setShowModal(false)
      setForm({ studentId: '', subjectId: '', examType: 'INTERNAL', totalMarks: 100, obtainedMarks: '', remarks: '' })
      if (selectedSubject) fetchMarks()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const examTypeColors = {
    INTERNAL: 'bg-blue-100 text-blue-700',
    MIDTERM: 'bg-purple-100 text-purple-700',
    FINAL: 'bg-red-100 text-red-700',
    PRACTICAL: 'bg-green-100 text-green-700',
  }

  return (
    <InstructorLayout>
      <div className="p-8">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Marks</h1>
            <p className="text-gray-500 text-sm mt-1">Add and view student exam marks</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setError('') }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            + Add Marks
          </button>
        </div>

        {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Subject Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a subject to view marks</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} - {s.code}</option>
            ))}
          </select>
        </div>

        {/* Marks Table */}
        {selectedSubject && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Exam Type</th>
                    <th className="px-6 py-4">Obtained</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Percentage</th>
                    <th className="px-6 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark) => (
                    <tr key={mark.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {mark.student?.user?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${examTypeColors[mark.examType]}`}>
                          {mark.examType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{mark.obtainedMarks}</td>
                      <td className="px-6 py-4 text-gray-500">{mark.totalMarks}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (mark.obtainedMarks / mark.totalMarks) >= 0.7 ? 'text-green-600' :
                          (mark.obtainedMarks / mark.totalMarks) >= 0.4 ? 'text-orange-500' :
                          'text-red-600'}`}>
                          {((mark.obtainedMarks / mark.totalMarks) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{mark.remarks || '-'}</td>
                    </tr>
                  ))}
                  {marks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No marks added for this subject yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* Add Marks Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add Marks</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.student?.id} value={s.student?.id}>{s.name}</option>
                ))}
              </select>
              <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="INTERNAL">Internal</option>
                <option value="MIDTERM">Midterm</option>
                <option value="FINAL">Final</option>
                <option value="PRACTICAL">Practical</option>
              </select>
              <div className="flex gap-3">
                <input type="number" placeholder="Total Marks" required
                  value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input type="number" placeholder="Obtained Marks" required
                  value={form.obtainedMarks} onChange={(e) => setForm({ ...form, obtainedMarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <input type="text" placeholder="Remarks (optional)"
                value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium">Add Marks</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </InstructorLayout>
  )
}

export default Marks