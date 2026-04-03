import { useCallback, useEffect, useState } from 'react'
import { Plus, UploadCloud } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'
import Alert from '../../components/Alert'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useToast } from '../../components/Toast'
import { useReferenceData } from '../../context/ReferenceDataContext'
import { useAuth } from '../../context/AuthContext'
import logger from '../../utils/logger'

const examTypes = ['INTERNAL', 'MIDTERM', 'FINAL', 'PREBOARD', 'PRACTICAL']
const studentPublishableExamTypes = examTypes.filter((type) => type !== 'PRACTICAL')

const examTypeLabels = {
  INTERNAL: 'Internal',
  MIDTERM: 'Mid-Term',
  FINAL: 'Final',
  PREBOARD: 'Preboard',
  PRACTICAL: 'Practical'
}

const Marks = () => {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const isCoordinator = user?.role === 'COORDINATOR'
  const { subjects, loadSubjects } = useReferenceData()
  const [marks, setMarks] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '')
  const [selectedExamType, setSelectedExamType] = useState(isCoordinator ? 'MIDTERM' : '')
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    unpublished: 0,
    byExamType: []
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    subjectId: '',
    examType: 'MIDTERM',
    totalMarks: 100
  })
  const [draftMarks, setDraftMarks] = useState({})
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
    } catch (fetchError) {
      logger.error('Failed to load subject students', fetchError)
      setStudents([])
    }
  }, [])

  const fetchMarks = useCallback(async () => {
    try {
      setLoading(true)

      if (isCoordinator) {
        const res = await api.get('/marks/review', {
          params: {
            page,
            limit,
            ...(selectedExamType ? { examType: selectedExamType } : {}),
            ...(selectedSubject ? { subjectId: selectedSubject } : {})
          }
        })
        setMarks(res.data.marks || [])
        setTotal(res.data.total || 0)
        setStats(res.data.stats || { total: 0, published: 0, unpublished: 0, byExamType: [] })
        return
      }

      if (!selectedSubject) {
        setMarks([])
        setTotal(0)
        setStats({ total: 0, published: 0, unpublished: 0, byExamType: [] })
        return
      }

      const res = await api.get(`/marks/subject/${selectedSubject}`, {
        params: {
          page,
          limit,
          ...(selectedExamType ? { examType: selectedExamType } : {})
        }
      })
      setMarks(res.data.marks || [])
      setTotal(res.data.total || 0)
      setStats(res.data.stats || { total: 0, published: 0, unpublished: 0, byExamType: [] })
    } catch (fetchError) {
      logger.error('Failed to load marks', fetchError)
    } finally {
      setLoading(false)
    }
  }, [isCoordinator, limit, page, selectedExamType, selectedSubject])

  useEffect(() => {
    void loadSubjects().catch((loadError) => {
      logger.error('Failed to load subjects', loadError)
    })
  }, [loadSubjects])

  useEffect(() => {
    void fetchMarks()
  }, [fetchMarks])

  useEffect(() => {
    if (!showModal || isCoordinator) return

    if (form.subjectId) {
      void fetchStudents(form.subjectId)
      return
    }

    setStudents([])
  }, [fetchStudents, form.subjectId, isCoordinator, showModal])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const entries = Object.entries(draftMarks)
        .map(([studentId, value]) => ({
          studentId,
          obtainedMarks: value?.obtainedMarks,
          remarks: value?.remarks || ''
        }))
        .filter((entry) => entry.obtainedMarks !== '' && entry.obtainedMarks !== undefined && entry.obtainedMarks !== null)

      if (!form.subjectId || !form.examType) {
        setError('Please select the exam type and module first')
        return
      }

      if (entries.length === 0) {
        setError('Enter marks for at least one student')
        return
      }

      await Promise.all(entries.map((entry) => api.post('/marks', {
        studentId: entry.studentId,
        subjectId: form.subjectId,
        examType: form.examType,
        totalMarks: parseInt(form.totalMarks, 10),
        obtainedMarks: parseInt(entry.obtainedMarks, 10),
        remarks: entry.remarks
      })))

      showToast({ title: `Exam marks added for ${entries.length} student${entries.length === 1 ? '' : 's'}.` })
      setShowModal(false)
      setForm({
        subjectId: selectedSubject || '',
        examType: selectedExamType || 'MIDTERM',
        totalMarks: 100
      })
      setDraftMarks({})
      await fetchMarks()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handlePublish = async () => {
    if (!selectedExamType) {
      setError('Please select the exam result type to publish')
      return
    }

    if (selectedExamType === 'PRACTICAL') {
      setError('Practical marks remain visible only to instructors and coordinators')
      return
    }

    try {
      setPublishing(true)
      setError('')
      const res = await api.post('/marks/publish', {
        examType: selectedExamType,
        ...(selectedSubject ? { subjectId: selectedSubject } : {})
      })
      showToast({ title: res.data.message })
      await fetchMarks()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to publish results right now')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <InstructorLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title={isCoordinator ? 'Exam Result Publishing' : 'Exam Marks'}
          subtitle={isCoordinator
            ? 'Publish Mid-Term, Final, or Preboard results for students. Practical marks stay internal for staff only.'
            : 'Add marks for your own module exams. Practical marks remain visible only to instructors and coordinators.'}
          breadcrumbs={[isCoordinator ? 'Coordinator' : 'Instructor', 'Exam Results']}
          actions={[
            ...(!isCoordinator ? [{
              label: 'Add Exam Mark',
              icon: Plus,
              variant: 'primary',
              onClick: () => {
                setShowModal(true)
                setError('')
                setForm((current) => ({
                  ...current,
                  subjectId: selectedSubject || current.subjectId,
                  examType: selectedExamType || current.examType
                }))
                setDraftMarks({})
              }
            }] : []),
            ...(isCoordinator ? [{
              label: publishing ? 'Publishing...' : `Publish ${examTypeLabels[selectedExamType] || 'Results'}`,
              icon: UploadCloud,
              variant: 'secondary',
              onClick: handlePublish,
              disabled: publishing || !selectedExamType || selectedExamType === 'PRACTICAL'
            }] : [])
          ]}
        />

        <Alert type="error" message={error} />

        <div className="mb-6 grid gap-4 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-600">{isCoordinator ? 'Module Filter' : 'Module'}</label>
            <select
              value={selectedSubject}
              onChange={(event) => {
                setSelectedSubject(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">{isCoordinator ? 'All Department Modules' : 'Select a module'}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} - {subject.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">Exam Result Type</label>
            <select
              value={selectedExamType}
              onChange={(event) => {
                setSelectedExamType(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Exam Types</option>
              {examTypes.map((examType) => (
                <option key={examType} value={examType}>
                  {examTypeLabels[examType]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">Records</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{stats.total || total}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">Published</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.published || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">Unpublished</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.unpublished || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">Practical Visibility</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Staff only</p>
            <p className="mt-1 text-xs text-slate-500">Students never see practical marks</p>
          </div>
        </div>

        {stats.byExamType?.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-slate-700">Exam Result Publishing Status</p>
            <div className="grid gap-3 md:grid-cols-4">
              {stats.byExamType.map((item) => (
                <div key={item.examType} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">{examTypeLabels[item.examType] || item.examType}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.count} records</p>
                  <p className="mt-1 text-xs text-green-600">{item.published} published</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!isCoordinator && !selectedSubject) ? (
          <div className="rounded-2xl bg-white p-10 shadow-sm">
            <EmptyState
              icon="📝"
              title="Select a module first"
              description="Choose one of your modules to add or review exam marks."
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <LoadingSpinner text="Loading examination results..." />
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {isCoordinator ? 'Department Exam Result Review' : 'Module Exam Mark Ledger'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {isCoordinator
                        ? 'Review marks by exam result type before publishing them for students.'
                        : 'Every mark stays internal until a coordinator publishes the matching exam result.'}
                    </p>
                  </div>
                  <span className="ui-status-badge ui-status-neutral">{total} records</span>
                </div>
                <div className="overflow-x-auto max-h-[720px]">
                  <table className="w-full min-w-[1100px]">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Module</th>
                        <th className="px-6 py-4">Exam Type</th>
                        <th className="px-6 py-4">Marks</th>
                        <th className="px-6 py-4">Percentage</th>
                        <th className="px-6 py-4">Grade</th>
                        <th className="px-6 py-4">Publication</th>
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
                            <p className="font-medium text-slate-900">{mark.subject?.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{mark.subject?.code}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{examTypeLabels[mark.examType] || mark.examType}</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{mark.obtainedMarks}/{mark.totalMarks}</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{mark.percentage.toFixed(1)}%</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{mark.grade}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              mark.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                            >
                              {mark.isPublished ? 'Published' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">{mark.remarks || '-'}</td>
                        </tr>
                      ))}
                      {marks.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-10">
                            <EmptyState
                              icon="📝"
                              title="No exam marks found"
                              description={isCoordinator
                                ? 'No marks match the selected exam result filter yet.'
                                : 'Add the first exam record for this module to build the result ledger.'}
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

      {showModal && !isCoordinator && (
        <Modal title="Add Examination Mark" onClose={() => setShowModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={form.examType}
              onChange={(event) => {
                setForm({ ...form, examType: event.target.value })
                setDraftMarks({})
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {examTypes.map((examType) => (
                <option key={examType} value={examType}>
                  {examTypeLabels[examType]}
                </option>
              ))}
            </select>
            <select
              required
              value={form.subjectId}
              onChange={(event) => {
                setForm({ ...form, subjectId: event.target.value })
                setDraftMarks({})
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Module</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Full Marks"
              required
              value={form.totalMarks}
              onChange={(event) => setForm({ ...form, totalMarks: event.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {form.subjectId ? (
              students.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  No enrolled students found for this module.
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {students.map((student) => (
                    <div key={student.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3">
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">
                          {student.rollNumber} • Semester {student.semester}{student.section ? ` • Section ${student.section}` : ''}
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                        <input
                          type="number"
                          min="0"
                          max={form.totalMarks || undefined}
                          placeholder="Marks"
                          value={draftMarks[student.id]?.obtainedMarks ?? ''}
                          onChange={(event) => setDraftMarks((current) => ({
                            ...current,
                            [student.id]: {
                              ...current[student.id],
                              obtainedMarks: event.target.value
                            }
                          }))}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="text"
                          placeholder="Remarks (optional)"
                          value={draftMarks[student.id]?.remarks ?? ''}
                          onChange={(event) => setDraftMarks((current) => ({
                            ...current,
                            [student.id]: {
                              ...current[student.id],
                              remarks: event.target.value
                            }
                          }))}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {form.examType === 'PRACTICAL'
                ? 'Practical marks will remain visible only to instructors and coordinators.'
                : 'Students can only view this result after the coordinator publishes the matching exam result.'}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium"
              >
                Save Mark
              </button>
            </div>
          </form>
        </Modal>
      )}
    </InstructorLayout>
  )
}

export default Marks
