import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { useReferenceData } from '../../context/ReferenceDataContext'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { getFriendlyErrorMessage } from '../../utils/errors'
import logger from '../../utils/logger'
const Subjects = () => {
  const { subjects, departments, loadSubjects, loadDepartments } = useReferenceData()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [subjectToDelete, setSubjectToDelete] = useState(null)
  const [deletingSubject, setDeletingSubject] = useState(false)
  const [enrollmentSubject, setEnrollmentSubject] = useState(null)
  const [enrollmentStudents, setEnrollmentStudents] = useState([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [savingEnrollments, setSavingEnrollments] = useState(false)
  const [enrollmentSearch, setEnrollmentSearch] = useState('')
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    semester: 1, department: '', instructorId: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const debouncedEnrollmentSearch = useDebouncedValue(enrollmentSearch, 250)

  useEffect(() => {
    void fetchSubjects()
    fetchInstructors()
  }, [])

  useEffect(() => {
    void loadDepartments().catch((error) => {
      logger.error('Failed to load departments', error)
    })
  }, [loadDepartments])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      await loadSubjects({ force: true })
    } catch (error) {
      logger.error('Failed to load subjects', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstructors = async () => {
    try {
      const res = await api.get('/admin/users?role=INSTRUCTOR')
      setInstructors(res.data.users)
    } catch (error) {
      logger.error('Failed to load instructors', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editSubject) {
        await api.put(`/subjects/${editSubject.id}`, form)
        setSuccess('Subject updated successfully!')
      } else {
        await api.post('/subjects', form)
        setSuccess('Subject created successfully!')
      }
      setShowModal(false)
      setEditSubject(null)
      setForm({ name: '', code: '', description: '', semester: 1, department: '', instructorId: '' })
      fetchSubjects()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to save the subject right now.'))
    }
  }

  const handleDelete = async () => {
    if (!subjectToDelete) return
    const previousSubjects = subjects
    try {
      setDeletingSubject(true)
      const target = subjectToDelete
      setSubjectToDelete(null)
      setSubjects((current) => current.filter((subject) => subject.id !== target.id))
      await api.delete(`/subjects/${target.id}`)
      setSuccess('Subject deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setSubjects(previousSubjects)
      setError(getFriendlyErrorMessage(err, 'Unable to delete the subject right now.'))
    } finally {
      setDeletingSubject(false)
    }
  }

  const openEditModal = (subject) => {
    setEditSubject(subject)
    setForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      semester: subject.semester,
      department: subject.department || '',
      instructorId: subject.instructorId || ''
    })
    setError('')
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditSubject(null)
    setForm({ name: '', code: '', description: '', semester: 1, department: '', instructorId: '' })
    setError('')
    setShowModal(true)
  }

  const openEnrollmentModal = async (subject) => {
    try {
      setLoadingEnrollments(true)
      setEnrollmentSubject(subject)
      setEnrollmentSearch('')
      setError('')
      const res = await api.get(`/subjects/${subject.id}/enrollments`)
      setEnrollmentStudents(res.data.students)
    } catch (err) {
      setEnrollmentSubject(null)
      setError(getFriendlyErrorMessage(err, 'Unable to load subject enrollments.'))
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const toggleEnrollment = (studentId) => {
    setEnrollmentStudents((current) => current.map((student) => (
      student.id === studentId ? { ...student, enrolled: !student.enrolled } : student
    )))
  }

  const applySuggestedEnrollments = () => {
    setEnrollmentStudents((current) => current.map((student) => ({
      ...student,
      enrolled: student.suggested
    })))
  }

  const saveEnrollments = async () => {
    if (!enrollmentSubject) return

    try {
      setSavingEnrollments(true)
      setError('')
      await api.put(`/subjects/${enrollmentSubject.id}/enrollments`, {
        studentIds: enrollmentStudents.filter((student) => student.enrolled).map((student) => student.id)
      })
      setSuccess('Subject enrollments updated successfully!')
      setEnrollmentSubject(null)
      setEnrollmentStudents([])
      fetchSubjects()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to update enrollments right now.'))
    } finally {
      setSavingEnrollments(false)
    }
  }

  const filteredEnrollmentStudents = enrollmentStudents.filter((student) => {
    const keyword = debouncedEnrollmentSearch.trim().toLowerCase()
    if (!keyword) return true

    return [
      student.name,
      student.email,
      student.rollNumber,
      student.department || '',
      student.section || ''
    ].some((value) => value.toLowerCase().includes(keyword))
  })

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
            <p className="text-gray-500 text-sm mt-1">Manage all subjects in EduNexus</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Add Subject
          </button>
        </div>

        {/* Success/Error */}
        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Subjects Grid */}
        {loading ? (
          <LoadingSkeleton rows={6} itemClassName="h-44" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">

                {/* Subject header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {subject.code}
                    </span>
                    <h3 className="font-semibold text-gray-800 mt-2">{subject.name}</h3>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Sem {subject.semester}
                  </span>
                </div>

                {/* Description */}
                {subject.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{subject.description}</p>
                )}

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400">Instructor:</span>
                  <span className="text-xs font-medium text-gray-700">
                    {subject.instructor?.user?.name || 'Not assigned'}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-4 text-xs text-gray-500">
                  <span>📝 {subject._count?.assignments} assignments</span>
                  <span>📋 {subject._count?.attendances} attendances</span>
                  <span>👥 {subject._count?.enrollments || 0} students</span>
                </div>

                {/* Department */}
                {subject.department && (
                  <div className="mb-4">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
                      {subject.department}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => openEditModal(subject)}
                    className="text-xs bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition font-medium px-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openEnrollmentModal(subject)}
                    className="flex-1 text-xs bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition font-medium"
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setSubjectToDelete(subject)}
                    className="text-xs bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition font-medium px-3"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}

            {subjects.length === 0 && (
              <div className="col-span-3">
                <EmptyState
                  icon="📚"
                  title="No subjects yet"
                  description="Create your first subject and assign an instructor to start building the academic structure."
                  action={(
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Add Subject
                    </button>
                  )}
                />
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editSubject ? 'Edit Subject' : 'Add Subject'} onClose={() => setShowModal(false)}>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Subject Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Subject Code (e.g. CN301)"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!editSubject}
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Semester"
                  min="1"
                  max="8"
                  required
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.name}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructor dropdown */}
              <select
                value={form.instructorId}
                onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Instructor (optional)</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.instructor?.id}>
                    {inst.name} - {inst.instructor?.department || 'No dept'}
                  </option>
                ))}
              </select>

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
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 font-medium"
                >
                  {editSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {enrollmentSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Manage Enrollments</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {enrollmentSubject.name} ({enrollmentSubject.code})
                </p>
              </div>
              <button
                onClick={() => setEnrollmentSubject(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <input
                type="text"
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                placeholder="Search students by name, roll, email, section..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={applySuggestedEnrollments}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100"
              >
                Apply Suggested
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Suggested students match the subject&apos;s semester and department. You can adjust the final class list manually.
            </p>

            {loadingEnrollments ? (
              <div className="text-center text-gray-500 py-12">Loading students...</div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredEnrollmentStudents.map((student) => (
                  <label key={student.id} className="flex items-start gap-3 border rounded-xl p-4 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={student.enrolled}
                      onChange={() => toggleEnrollment(student.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">{student.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{student.rollNumber} • {student.email}</p>
                        </div>
                        {student.suggested && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
                            Suggested
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Semester {student.semester}{student.department ? ` • ${student.department}` : ''}{student.section ? ` • Section ${student.section}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
                {filteredEnrollmentStudents.length === 0 && (
                  <EmptyState
                    icon="🧑‍🎓"
                    title="No students matched"
                    description="Try a different search term or apply the suggested enrollment list for this subject."
                  />
                )}
              </div>
            )}

            <div className="flex gap-3 pt-6 mt-4 border-t">
              <button
                type="button"
                onClick={() => setEnrollmentSubject(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEnrollments}
                disabled={savingEnrollments || loadingEnrollments}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingEnrollments ? 'Saving...' : 'Save Enrollments'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!subjectToDelete}
        title="Delete Subject"
        message={subjectToDelete
          ? `Delete ${subjectToDelete.name} (${subjectToDelete.code})? This removes the subject from active use.`
          : ''}
        confirmText="Delete Subject"
        busy={deletingSubject}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleDelete}
      />

    </AdminLayout>
  )
}

export default Subjects



