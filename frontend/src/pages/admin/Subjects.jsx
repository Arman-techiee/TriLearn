import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'

const Subjects = () => {
  const [subjects, setSubjects] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    semester: 1, department: '', instructorId: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSubjects()
    fetchInstructors()
  }, [])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const res = await api.get('/subjects')
      setSubjects(res.data.subjects)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstructors = async () => {
    try {
      const res = await api.get('/admin/users?role=INSTRUCTOR')
      setInstructors(res.data.users)
    } catch (error) {
      console.error(error)
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
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return
    try {
      await api.delete(`/subjects/${id}`)
      setSuccess('Subject deleted successfully!')
      fetchSubjects()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
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
          <div className="text-center text-gray-500 py-8">Loading...</div>
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
                    className="flex-1 text-xs bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="flex-1 text-xs bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}

            {subjects.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                No subjects yet. Click + Add Subject to create one!
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editSubject ? 'Edit Subject' : 'Add Subject'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

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
                <input
                  type="text"
                  placeholder="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

          </div>
        </div>
      )}

    </AdminLayout>
  )
}

export default Subjects