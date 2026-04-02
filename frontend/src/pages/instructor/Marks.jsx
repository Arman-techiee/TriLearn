import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'
import Alert from '../../components/Alert'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../components/Toast'
import { useReferenceData } from '../../context/ReferenceDataContext'
import logger from '../../utils/logger'
const Marks = () => {
  const { subjects, loadSubjects } = useReferenceData()
  const [marks, setMarks] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    studentId: '', subjectId: '', examType: 'INTERNAL',
    totalMarks: 100, obtainedMarks: '', remarks: ''
  })
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const fetchStudents = useCallback(async (subjectId) => {
    if (!subjectId) {
      setStudents([])
      return
    }

    try {
      const res = await api.get(`/marks/subject/${subjectId}/students`)
      setStudents(res.data.students)
    } catch (error) {
      logger.error('Failed to load subject students', error)
      setStudents([])
    }
  }, [])

  const fetchMarks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/marks/subject/${selectedSubject}?page=${page}&limit=${limit}`)
      setMarks(res.data.marks)
      setTotal(res.data.total)
    } catch (error) {
      logger.error('Failed to load marks', error)
    } finally {
      setLoading(false)
    }
  }, [limit, page, selectedSubject])

  useEffect(() => {
    void loadSubjects().catch((error) => {
      logger.error('Failed to load subjects', error)
    })
  }, [loadSubjects])

  useEffect(() => {
    if (selectedSubject) {
      void fetchMarks()
    }
  }, [fetchMarks, selectedSubject])

  useEffect(() => {
    if (!showModal) return

    if (form.subjectId) {
      void fetchStudents(form.subjectId)
      return
    }

    setStudents([])
  }, [fetchStudents, form.subjectId, showModal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/marks', {
        ...form,
        totalMarks: parseInt(form.totalMarks),
        obtainedMarks: parseInt(form.obtainedMarks)
      })
      showToast({ title: 'Result record added successfully.' })
      setShowModal(false)
      setForm({ studentId: '', subjectId: '', examType: 'INTERNAL', totalMarks: 100, obtainedMarks: '', remarks: '' })
      if (selectedSubject) void fetchMarks()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <InstructorLayout>
      <div className="p-4 md:p-8">

        <PageHeader
          title="Examination Results"
          subtitle="Publish and review student examination results with a cleaner academic presentation."
          breadcrumbs={['Instructor', 'Results']}
          actions={[{
            label: 'Add Result',
            icon: Plus,
            variant: 'primary',
            onClick: () => {
              setShowModal(true)
              setError('')
              setForm((current) => ({
                ...current,
                subjectId: selectedSubject || current.subjectId
              }))
            }
          }]}
        />

        <Alert type="error" message={error} />

        {/* Subject Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              setPage(1)
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a subject to view examination results</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} - {s.code}</option>
            ))}
          </select>
        </div>

        {/* Results Table */}
        {selectedSubject && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <LoadingSpinner text="Loading examination results..." />
            ) : (
              <>
              <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Published Result Records</h2>
                  <p className="text-sm text-gray-500 mt-1">Each row represents an assessment component recorded for the selected subject.</p>
                </div>
                <span className="ui-status-badge ui-status-neutral">{total} records</span>
              </div>
              <div className="overflow-x-auto max-h-[720px]">
              <table className="w-full min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-slate-50">
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
                    <tr key={mark.id} className="border-t border-slate-200 transition-colors hover:bg-blue-50/30">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{mark.student?.user?.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{mark.student?.rollNumber || mark.student?.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={mark.examType} />
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
                      <td colSpan={6} className="px-6 py-10">
                        <EmptyState
                          icon="📝"
                          title="No results published yet"
                          description="Publish the first result record for this subject to start building the academic ledger."
                          action={(
                            <button
                              type="button"
                              onClick={() => {
                                setShowModal(true)
                                setError('')
                                setForm((current) => ({
                                  ...current,
                                  subjectId: selectedSubject || current.subjectId
                                }))
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-role-accent)] px-4 py-2 text-sm font-medium text-white"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add Result</span>
                            </button>
                          )}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
              <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
              </>
            )}
          </div>
        )}

      </div>

      {/* Add Result Modal */}
      {showModal && (
        <Modal title="Publish Examination Result" onClose={() => setShowModal(false)}>
            <Alert type="error" message={error} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value, studentId: '' })}
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
                <input type="number" placeholder="Full Marks" required
                  value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input type="number" placeholder="Obtained Score" required
                  value={form.obtainedMarks} onChange={(e) => setForm({ ...form, obtainedMarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <input type="text" placeholder="Result Remarks (optional)"
                value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium">Publish Result</button>
              </div>
            </form>
        </Modal>
      )}

    </InstructorLayout>
  )
}

export default Marks



