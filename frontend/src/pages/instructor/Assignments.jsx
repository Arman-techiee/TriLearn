import { useState, useEffect } from 'react'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'

const Assignments = () => {
  const [assignments, setAssignments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', subjectId: '',
    dueDate: '', totalMarks: 100
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAssignments()
    fetchSubjects()
  }, [])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/assignments')
      setAssignments(res.data.assignments)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects')
      setSubjects(res.data.subjects)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/assignments', form)
      setSuccess('Assignment created successfully!')
      setShowModal(false)
      setForm({ title: '', description: '', subjectId: '', dueDate: '', totalMarks: 100 })
      fetchAssignments()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleGrade = async (submissionId, obtainedMarks) => {
    try {
      await api.patch(`/assignments/submissions/${submissionId}/grade`, { obtainedMarks: parseInt(obtainedMarks) })
      setSuccess('Graded successfully!')
      if (showSubmissions) {
        const res = await api.get(`/assignments/${showSubmissions.id}`)
        setShowSubmissions(res.data.assignment)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const isOverdue = (dueDate) => new Date() > new Date(dueDate)

  return (
    <InstructorLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
            <p className="text-gray-500 text-sm mt-1">Create and manage assignments</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setError('') }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            + Create Assignment
          </button>
        </div>

        {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Assignments List */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                      {isOverdue(assignment.dueDate) && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Overdue</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{assignment.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>📚 {assignment.subject?.name}</span>
                      <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span>🎯 Total: {assignment.totalMarks} marks</span>
                      <span>📋 {assignment._count?.submissions} submissions</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await api.get(`/assignments/${assignment.id}`)
                      setShowSubmissions(res.data.assignment)
                    }}
                    className="ml-4 text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="text-center py-12 text-gray-400">No assignments yet!</div>
            )}
          </div>
        )}

      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Create Assignment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text" placeholder="Assignment Title" required
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Description" required rows={3}
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - {s.code}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <input
                  type="datetime-local" required
                  value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number" placeholder="Total Marks"
                  value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Submissions — {showSubmissions.title}
              </h2>
              <button onClick={() => setShowSubmissions(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
            <div className="space-y-4">
              {showSubmissions.submissions?.length === 0 && (
                <p className="text-gray-400 text-center py-8">No submissions yet</p>
              )}
              {showSubmissions.submissions?.map((sub) => (
                <div key={sub.id} className="border rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{sub.student?.user?.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{sub.note || 'No note'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
                        ${sub.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                          sub.status === 'LATE' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'}`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === 'GRADED' ? (
                        <span className="text-sm font-bold text-green-600">
                          {sub.obtainedMarks}/{showSubmissions.totalMarks}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Marks"
                            min="0"
                            max={showSubmissions.totalMarks}
                            id={`grade-${sub.id}`}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => {
                              const val = document.getElementById(`grade-${sub.id}`).value
                              handleGrade(sub.id, val)
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700"
                          >
                            Grade
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </InstructorLayout>
  )
}

export default Assignments