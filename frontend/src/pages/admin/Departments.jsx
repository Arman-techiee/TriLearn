import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import Alert from '../../components/Alert'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import useApi from '../../hooks/useApi'
import api from '../../utils/api'
import { getFriendlyErrorMessage } from '../../utils/errors'

const emptyForm = { name: '', code: '', description: '' }

const Departments = () => {
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [departmentToDelete, setDepartmentToDelete] = useState(null)
  const [deletingDepartment, setDeletingDepartment] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [success, setSuccess] = useState('')
  const {
    data: departments = [],
    setData: setDepartments,
    loading,
    error,
    setError,
    execute
  } = useApi({ initialData: [], initialLoading: true })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    await execute(
      () => api.get('/departments'),
      {
        fallbackMessage: 'Unable to load departments',
        transform: (response) => response.data.departments
      }
    )
  }

  const openCreateModal = () => {
    setEditingDepartment(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (department) => {
    setEditingDepartment(department)
    setForm({
      name: department.name,
      code: department.code,
      description: department.description || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, form)
        setSuccess('Department updated successfully!')
      } else {
        await api.post('/departments', form)
        setSuccess('Department created successfully!')
      }

      setShowModal(false)
      setForm(emptyForm)
      setEditingDepartment(null)
      fetchDepartments()
      setTimeout(() => setSuccess(''), 3000)
    } catch (submitError) {
      setError(getFriendlyErrorMessage(submitError, 'Unable to save the department right now.'))
    }
  }

  const handleDelete = async () => {
    if (!departmentToDelete) return
    try {
      setDeletingDepartment(true)
      const target = departmentToDelete
      setDepartmentToDelete(null)
      setDepartments((current) => current.filter((department) => department.id !== target.id))
      await api.delete(`/departments/${target.id}`)
      setSuccess('Department deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (deleteError) {
      await fetchDepartments()
      setError(getFriendlyErrorMessage(deleteError, 'Unable to delete the department right now.'))
    } finally {
      setDeletingDepartment(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <PageHeader
          title="Departments"
          subtitle="Create and manage the departments used across users and subjects."
          breadcrumbs={['Admin', 'Departments']}
          actions={[{ label: 'Add Department', icon: Plus, variant: 'primary', onClick: openCreateModal }]}
        />

        <Alert type="success" message={success} />
        <Alert type="error" message={error} />

        {loading ? (
          <LoadingSkeleton rows={6} itemClassName="h-44" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {departments.map((department) => (
              <div key={department.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {department.code}
                    </span>
                    <h3 className="font-semibold text-gray-800 mt-2">{department.name}</h3>
                  </div>
                </div>

                {department.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">{department.description}</p>
                )}

                <div className="flex gap-4 text-xs text-gray-500 mb-4">
                  <span>👨‍🎓 {department._count?.students || 0} students</span>
                  <span>👩‍🏫 {department._count?.instructors || 0} instructors</span>
                  <span>📚 {department._count?.subjects || 0} subjects</span>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => openEditModal(department)}
                    className="flex-1 text-xs bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDepartmentToDelete(department)}
                    className="flex-1 text-xs bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {departments.length === 0 && (
              <div className="col-span-3">
                <EmptyState
                  icon="🏛️"
                  title="No departments yet"
                  description="Create your first department so students, instructors, and subjects can be organized properly."
                  action={(
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Add Department
                    </button>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editingDepartment ? 'Edit Department' : 'Add Department'} onClose={() => setShowModal(false)}>
            <Alert type="error" message={error} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="ui-form-label">Department Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="ui-form-input"
                />
              </div>
              <div>
                <label className="ui-form-label">Department Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="ui-form-input"
                />
              </div>
              <div>
                <label className="ui-form-label">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="ui-form-input"
                />
              </div>
              <div className="ui-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 font-medium">
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!departmentToDelete}
        title="Delete Department"
        message={departmentToDelete
          ? `Delete ${departmentToDelete.name}? This only works when no users or subjects still depend on it.`
          : ''}
        confirmText="Delete Department"
        busy={deletingDepartment}
        onClose={() => setDepartmentToDelete(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  )
}

export default Departments


