import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, UserPlus } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import CoordinatorLayout from '../../layouts/CoordinatorLayout'
import api from '../../utils/api'
import Alert from '../../components/Alert'
import ConfirmDialog from '../../components/ConfirmDialog'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { useToast } from '../../components/Toast'
import CreateUserModal from '../../components/users/CreateUserModal'
import EditUserModal from '../../components/users/EditUserModal'
import UserFilters from '../../components/users/UserFilters'
import UserTable from '../../components/users/UserTable'
import { useAuth } from '../../context/AuthContext'
import { useReferenceData } from '../../context/ReferenceDataContext'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import useForm from '../../hooks/useForm'
import { getFriendlyErrorMessage } from '../../utils/errors'
import { isRequestCanceled } from '../../utils/http'
import logger from '../../utils/logger'
import { ROLES } from '../../constants/roles'
const initialUserValues = {
  name: '',
  email: '',
  password: '',
  studentId: '',
  phone: '',
  department: '',
  departments: [],
  semester: '1',
  section: ''
}

const allVisibleRoles = ['', ROLES.ADMIN, ROLES.COORDINATOR, ROLES.GATEKEEPER, ROLES.INSTRUCTOR, ROLES.STUDENT]
const coordinatorVisibleRoles = ['', ROLES.GATEKEEPER, ROLES.INSTRUCTOR, ROLES.STUDENT]
const semesterFilterOptions = [
  { value: '', label: 'All semesters' },
  ...Array.from({ length: 8 }, (_, index) => ({
    value: String(index + 1),
    label: `Semester ${index + 1}`
  })),
  { value: 'graduate', label: 'Graduates' }
]
const academicSemesterOptions = Array.from({ length: 8 }, (_, index) => String(index + 1))
const STUDENT_IMPORT_POLL_INTERVAL_MS = 1500
const STUDENT_IMPORT_MAX_POLL_ATTEMPTS = 40
const STUDENT_IMPORT_TEMPLATE_FILENAME = 'trilearn-student-import-template.csv'
const STUDENT_IMPORT_TEMPLATE_ROWS = [
  ['name', 'email', 'studentId', 'department', 'semester', 'section', 'phone', 'address'],
  ['Asha Sharma', 'asha@example.edu', 'CS-001', 'CS', '1', 'A', '9800000000', 'Kathmandu']
]

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms)
})

const normalizeApiStatusPath = (statusUrl) => (
  String(statusUrl || '').replace(/^\/api\/v\d+/i, '') || statusUrl
)

const escapeCsvCell = (value) => {
  const stringValue = String(value ?? '')
  if (!/[",\r\n]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replace(/"/g, '""')}"`
}

const buildStudentImportTemplateCsv = () => (
  STUDENT_IMPORT_TEMPLATE_ROWS
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')
)

const downloadStudentImportTemplate = () => {
  const blob = new Blob([buildStudentImportTemplateCsv()], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = STUDENT_IMPORT_TEMPLATE_FILENAME
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const Users = () => {
  const { user: currentUser } = useAuth()
  const { departments, loadDepartments } = useReferenceData()
  const isCoordinator = currentUser?.role === ROLES.COORDINATOR
  const Layout = isCoordinator ? CoordinatorLayout : AdminLayout
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('instructor')
  const [userToDelete, setUserToDelete] = useState(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showIdUpdateModal, setShowIdUpdateModal] = useState(false)
  const [importingStudents, setImportingStudents] = useState(false)
  const [updatingStudentIds, setUpdatingStudentIds] = useState(false)
  const [promotingStudent, setPromotingStudent] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [idUpdateFile, setIdUpdateFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [idUpdateResult, setIdUpdateResult] = useState(null)
  const [studentToPromote, setStudentToPromote] = useState(null)
  const [studentToManageSection, setStudentToManageSection] = useState(null)
  const [studentSectionForm, setStudentSectionForm] = useState({ studentId: '', department: '', semester: '1', section: '' })
  const [updatingStudentSection, setUpdatingStudentSection] = useState(false)
  const [studentSectionError, setStudentSectionError] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [bulkSectionForm, setBulkSectionForm] = useState({ department: '', semester: '1', section: '' })
  const [bulkAssigningSection, setBulkAssigningSection] = useState(false)
  const [exportingStudents, setExportingStudents] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const [filterRole, setFilterRole] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const pageClassName = `${isCoordinator ? 'coordinator-page' : 'admin-page'} p-4 md:p-8`
  const visibleRoles = isCoordinator ? coordinatorVisibleRoles : allVisibleRoles
  const departmentSectionMap = useMemo(() => (
    departments.reduce((acc, department) => {
      const semesterMap = {}
      ;(department.semesterSections || []).forEach((entry) => {
        semesterMap[String(entry.semester)] = Array.isArray(entry.sections) ? entry.sections : []
      })

      acc[department.name] = semesterMap
      return acc
    }, {})
  ), [departments])

  const getSectionOptions = useCallback((departmentName, semester) => (
    departmentSectionMap[departmentName]?.[String(semester)] || []
  ), [departmentSectionMap])

  const studentsOnPage = useMemo(() => (
    users.filter((user) => Boolean(user.student))
  ), [users])
  const validateUserForm = (values) => {
    const validationErrors = {}

    if (!values.name.trim()) validationErrors.name = 'Name is required'
    if (modalType === 'student') {
      if (!values.email.trim()) validationErrors.email = 'Personal email is required'
      else if (!/\S+@\S+\.\S+/.test(values.email)) validationErrors.email = 'Enter a valid personal email address'
      if (!values.studentId.trim()) validationErrors.studentId = 'Student ID is required'
    } else {
      if (!values.email.trim()) validationErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(values.email)) validationErrors.email = 'Enter a valid email address'
      if (!values.password) validationErrors.password = 'Password is required'
      else if (values.password.length < 8) validationErrors.password = 'Password must be at least 8 characters'
      else if (!/[A-Z]/.test(values.password)) validationErrors.password = 'Password must include at least one uppercase letter'
      else if (!/[a-z]/.test(values.password)) validationErrors.password = 'Password must include at least one lowercase letter'
      else if (!/[0-9]/.test(values.password)) validationErrors.password = 'Password must include at least one number'
    }

    if (modalType === 'instructor' && (!Array.isArray(values.departments) || values.departments.length === 0)) {
      validationErrors.department = 'Select at least one department'
    } else if (modalType !== 'gatekeeper' && modalType !== 'instructor' && !values.department.trim()) {
      validationErrors.department = 'Department is required'
    }

    if (modalType === 'student') {
      const semester = parseInt(values.semester, 10)
      if (Number.isNaN(semester) || semester < 1 || semester > 8) {
        validationErrors.semester = 'Semester must be between 1 and 8'
      }
      const sectionOptions = getSectionOptions(values.department, values.semester)
      if (sectionOptions.length === 0) {
        validationErrors.section = 'Create a section for this department and semester in Departments first.'
      } else if (!values.section.trim()) {
        validationErrors.section = 'Section is required'
      } else if (!sectionOptions.includes(values.section.trim().toUpperCase())) {
        validationErrors.section = 'Select a valid configured section.'
      }
    }

    return validationErrors
  }
  const { values, errors, handleChange, handleSubmit, setValues, setErrors } = useForm(initialUserValues, validateUserForm)

  const handleInstructorDepartmentToggle = (departmentName) => {
    setValues((current) => {
      const selectedDepartments = Array.isArray(current.departments) ? current.departments : []
      const nextDepartments = selectedDepartments.includes(departmentName)
        ? selectedDepartments.filter((item) => item !== departmentName)
        : [...selectedDepartments, departmentName]

      return {
        ...current,
        departments: nextDepartments
      }
    })

    if (errors.department) {
      setErrors((current) => ({ ...current, department: '' }))
    }
  }

  useEffect(() => {
    setPage(1)
  }, [filterRole, semesterFilter, debouncedSearchTerm])

  useEffect(() => {
    if (filterRole && filterRole !== ROLES.STUDENT && semesterFilter) {
      setSemesterFilter('')
    }
  }, [filterRole, semesterFilter])

  useEffect(() => {
    void loadDepartments().catch((fetchError) => {
      logger.error('Failed to load departments', fetchError)
    })
  }, [loadDepartments])

  useEffect(() => {
    if (modalType !== 'student') {
      return
    }

    const sectionOptions = getSectionOptions(values.department, values.semester)
    if (sectionOptions.length === 0) {
      if (values.section) {
        setValues((current) => ({ ...current, section: '' }))
      }
      return
    }

    if (!sectionOptions.includes(values.section)) {
      setValues((current) => ({ ...current, section: sectionOptions[0] }))
    }
  }, [getSectionOptions, modalType, setValues, values.department, values.section, values.semester])

  useEffect(() => {
    setSelectedStudentIds((current) => current.filter((id) => studentsOnPage.some((student) => student.id === id)))
  }, [studentsOnPage])

  useEffect(() => {
    if (bulkSectionForm.department) {
      return
    }

    const firstDepartment = departments[0]?.name || ''
    if (!firstDepartment) {
      return
    }

    const initialSectionOptions = getSectionOptions(firstDepartment, bulkSectionForm.semester)
    setBulkSectionForm((current) => ({
      ...current,
      department: firstDepartment,
      section: initialSectionOptions[0] || ''
    }))
  }, [bulkSectionForm.department, bulkSectionForm.semester, departments, getSectionOptions])

  const fetchUsers = useCallback(async (signal) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      })

      if (filterRole) {
        params.set('role', filterRole)
      }
      if (semesterFilter === 'graduate') {
        params.set('graduated', 'true')
      } else if (semesterFilter) {
        params.set('semester', semesterFilter)
        params.set('graduated', 'false')
      }
      if (debouncedSearchTerm.trim()) {
        params.set('search', debouncedSearchTerm.trim())
      }

      const res = await api.get(`/admin/users?${params.toString()}`, { signal })
      setUsers(res.data.users)
      setTotal(res.data.total)
    } catch (error) {
      if (isRequestCanceled(error)) return
      logger.error(error)
      setError(getFriendlyErrorMessage(error, 'Unable to load users right now.'))
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [debouncedSearchTerm, filterRole, limit, page, semesterFilter])

  useEffect(() => {
    const controller = new AbortController()
    void fetchUsers(controller.signal)
    return () => controller.abort()
  }, [fetchUsers])

  const handleCreateUser = async () => {
    setError('')
    try {
      const endpoint = modalType === 'coordinator'
        ? '/admin/users/coordinator'
        : modalType === 'instructor'
          ? '/admin/users/instructor'
          : modalType === 'gatekeeper'
            ? '/admin/users/gatekeeper'
            : '/admin/users/student'
      const payload = modalType === 'student'
        ? {
            name: values.name,
            email: values.email,
            studentId: values.studentId,
            phone: values.phone,
            address: '',
            department: values.department,
            semester: parseInt(values.semester, 10),
            section: values.section
          }
        : {
            name: values.name,
            email: values.email,
            password: values.password,
            phone: values.phone,
            address: '',
            department: modalType === 'gatekeeper'
              ? undefined
              : modalType === 'instructor'
                ? undefined
                : values.department,
            departments: modalType === 'instructor' ? values.departments : undefined
          }
      const res = await api.post(endpoint, {
        ...payload
      })
      if (modalType === 'student') {
        const loginEmail = res.data.user?.email
        showToast({
          title: 'Student account created.',
          description: res.data.welcomeEmailSent
            ? `Login email: ${loginEmail}. Temporary login instructions were sent by email.`
            : `Login email: ${loginEmail}. The account was created, but the welcome email could not be delivered.`
        })
      } else {
        showToast({ title: `${modalType} created successfully.` })
      }
      setFilterRole(modalType === 'student' ? ROLES.STUDENT : modalType === 'instructor' ? ROLES.INSTRUCTOR : modalType === 'gatekeeper' ? ROLES.GATEKEEPER : '')
      setSearchTerm('')
      setPage(1)
      setShowModal(false)
      setValues({
        ...initialUserValues
      })
      setErrors({})
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to create the user right now.'))
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const previousUsers = users
    const nextStatus = !currentStatus
    try {
      setUsers((current) => current.map((user) => (
        user.id === id ? { ...user, isActive: nextStatus } : user
      )))
      await api.patch(`/admin/users/${id}/toggle-status`)
      showToast({ title: `User ${nextStatus ? 'enabled' : 'disabled'} successfully.` })
    } catch (err) {
      setUsers(previousUsers)
      setError(getFriendlyErrorMessage(err, 'Unable to update the user right now.'))
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    const previousUsers = users
    const previousTotal = total
    try {
      setDeletingUser(true)
      const target = userToDelete
      setUserToDelete(null)
      setUsers((current) => current.filter((user) => user.id !== target.id))
      setTotal((current) => Math.max(0, current - 1))
      await api.delete(`/admin/users/${target.id}`)
      showToast({ title: 'User deleted successfully.' })
    } catch (err) {
      setUsers(previousUsers)
      setTotal(previousTotal)
      setError(getFriendlyErrorMessage(err, 'Unable to delete the user right now.'))
    } finally {
      setDeletingUser(false)
    }
  }

  const handlePromoteSemester = async () => {
    if (!studentToPromote?.student) return

    const target = studentToPromote
    const previousUsers = users
    const isGraduationAction = Number(target.student.semester) >= 8

    try {
      setPromotingStudent(true)
      setStudentToPromote(null)
      const response = await api.patch(`/admin/users/${target.id}/promote-semester`)
      const updatedStudent = response.data.student
      setUsers((current) => current.map((entry) => (
        entry.id === target.id
          ? {
              ...entry,
              student: {
                ...entry.student,
                ...updatedStudent
              }
            }
          : entry
      )))
      showToast({
        title: isGraduationAction ? 'Student marked as graduated.' : 'Student promoted successfully.',
        description: isGraduationAction
          ? `${target.name} graduated in ${updatedStudent?.graduationYear || new Date().getFullYear()}.`
          : `${target.name} is now in semester ${updatedStudent?.semester}.`
      })
    } catch (err) {
      setUsers(previousUsers)
      setError(getFriendlyErrorMessage(err, 'Unable to promote the student right now.'))
    } finally {
      setPromotingStudent(false)
    }
  }

  const openStudentSectionModal = (studentUser) => {
    const currentDepartment = studentUser?.student?.department || ''
    const currentSemester = String(studentUser?.student?.semester || '1')
    const sectionOptions = getSectionOptions(currentDepartment, currentSemester)
    const currentSection = String(studentUser?.student?.section || '').toUpperCase()

    setStudentSectionForm({
      studentId: studentUser?.student?.rollNumber || '',
      department: currentDepartment,
      semester: currentSemester,
      section: sectionOptions.includes(currentSection) ? currentSection : sectionOptions[0] || ''
    })
    setStudentSectionError('')
    setStudentToManageSection(studentUser)
  }

  const handleUpdateStudentSection = async (event) => {
    event.preventDefault()
    if (!studentToManageSection?.id) {
      return
    }

    const sectionOptions = getSectionOptions(studentSectionForm.department, studentSectionForm.semester)
    if (sectionOptions.length === 0) {
      setStudentSectionError('No section is configured for this department and semester yet.')
      return
    }

    if (!studentSectionForm.section || !sectionOptions.includes(studentSectionForm.section)) {
      setStudentSectionError('Select a valid section.')
      return
    }

    if (!studentSectionForm.studentId.trim()) {
      setStudentSectionError('Student ID is required.')
      return
    }

    try {
      setUpdatingStudentSection(true)
      setStudentSectionError('')
      await api.put(`/admin/users/${studentToManageSection.id}`, {
        studentId: studentSectionForm.studentId,
        department: studentSectionForm.department,
        semester: Number(studentSectionForm.semester),
        section: studentSectionForm.section
      })

      setUsers((current) => current.map((entry) => (
        entry.id === studentToManageSection.id
          ? {
              ...entry,
              student: {
                ...entry.student,
                rollNumber: studentSectionForm.studentId.trim().toUpperCase(),
                department: studentSectionForm.department,
                semester: Number(studentSectionForm.semester),
                section: studentSectionForm.section
              }
            }
          : entry
      )))

      showToast({
        title: 'Student details updated.',
        description: `${studentToManageSection.name} is now in semester ${studentSectionForm.semester}, section ${studentSectionForm.section}.`
      })
      setStudentToManageSection(null)
    } catch (requestError) {
      setStudentSectionError(getFriendlyErrorMessage(requestError, 'Unable to update student section right now.'))
    } finally {
      setUpdatingStudentSection(false)
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setError('')
    setValues({
      ...initialUserValues
    })
    setErrors({})
    setShowModal(true)
  }

  const openImportModal = () => {
    setError('')
    setImportFile(null)
    setImportResult(null)
    setShowImportModal(true)
  }

  const handleImportStudents = async () => {
    if (!importFile) {
      setError('Please choose a CSV or XLSX file to import.')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)

    try {
      setImportingStudents(true)
      setError('')
      const response = await api.post('/admin/users/student-import', formData)
      let importResponseData = response.data

      if (response.status === 202 && response.data?.statusUrl) {
        setImportResult({
          message: response.data.message || 'Student import queued.',
          jobId: response.data.jobId,
          state: 'queued'
        })

        const statusPath = normalizeApiStatusPath(response.data.statusUrl)
        let completedJob = null

        for (let attempt = 0; attempt < STUDENT_IMPORT_MAX_POLL_ATTEMPTS; attempt += 1) {
          await wait(STUDENT_IMPORT_POLL_INTERVAL_MS)
          const jobResponse = await api.get(statusPath)
          const job = jobResponse.data

          setImportResult({
            message: response.data.message || 'Student import queued.',
            jobId: job.id,
            state: job.state,
            progress: job.progress
          })

          if (job.state === 'completed') {
            completedJob = job
            break
          }

          if (job.state === 'failed') {
            const failedImport = job.result || {
              message: job.failedReason || 'Student import failed.'
            }
            setImportResult(failedImport)
            setError(failedImport.message || 'Student import failed.')
            return
          }
        }

        if (!completedJob) {
          setError('Student import is still processing. Please check again in a moment.')
          return
        }

        importResponseData = completedJob.result
      }

      setImportResult(importResponseData)
      await fetchUsers()
      showToast({
        title: 'Student import completed.',
        description: `${importResponseData?.summary?.created || 0} students created, ${importResponseData?.summary?.failed || 0} rows failed.`,
        type: 'success',
        duration: 5000
      })
    } catch (requestError) {
      setImportResult(requestError?.response?.data || null)
      setError(getFriendlyErrorMessage(requestError, 'Unable to import students right now.'))
    } finally {
      setImportingStudents(false)
    }
  }

  const canToggleStatus = (targetUser) => {
    if (!targetUser || targetUser.id === currentUser?.id) {
      return false
    }

    if (!isCoordinator) {
      return true
    }

    return true
  }

  const handleToggleStudentSelection = (userId) => {
    setSelectedStudentIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ))
  }

  const handleToggleAllStudentsOnPage = () => {
    const studentIdsOnPage = studentsOnPage.map((student) => student.id)
    const allSelected = studentIdsOnPage.length > 0 && studentIdsOnPage.every((id) => selectedStudentIds.includes(id))

    setSelectedStudentIds((current) => (
      allSelected
        ? current.filter((id) => !studentIdsOnPage.includes(id))
        : [...new Set([...current, ...studentIdsOnPage])]
    ))
  }

  const handleBulkAssignStudentSection = async () => {
    if (selectedStudentIds.length === 0) {
      setError('Select at least one student to update section.')
      return
    }

    const availableSections = getSectionOptions(bulkSectionForm.department, bulkSectionForm.semester)
    if (availableSections.length === 0) {
      setError('No sections are configured for the selected department and semester.')
      return
    }

    if (!bulkSectionForm.section || !availableSections.includes(bulkSectionForm.section)) {
      setError('Select a valid section for bulk update.')
      return
    }

    try {
      setBulkAssigningSection(true)
      setError('')
      await api.patch('/admin/users/students/assign-section', {
        userIds: selectedStudentIds,
        department: bulkSectionForm.department,
        semester: Number(bulkSectionForm.semester),
        section: bulkSectionForm.section
      })

      setUsers((current) => current.map((entry) => (
        selectedStudentIds.includes(entry.id) && entry.student
          ? {
              ...entry,
              student: {
                ...entry.student,
                department: bulkSectionForm.department,
                semester: Number(bulkSectionForm.semester),
                section: bulkSectionForm.section
              }
            }
          : entry
      )))
      showToast({
        title: 'Student sections updated.',
        description: `Moved ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'} to semester ${bulkSectionForm.semester}, section ${bulkSectionForm.section}.`
      })
      setSelectedStudentIds([])
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to bulk update student sections right now.'))
    } finally {
      setBulkAssigningSection(false)
    }
  }

  const handleExportStudents = async () => {
    try {
      setExportingStudents(true)
      setError('')
      const params = {}

      if (semesterFilter === 'graduate') {
        params.graduated = 'true'
      } else if (semesterFilter) {
        params.semester = semesterFilter
        params.graduated = 'false'
      }

      const response = await api.get('/admin/users/students/export', {
        params,
        responseType: 'blob'
      })
      const contentDisposition = response.headers['content-disposition'] || ''
      const matchedName = contentDisposition.match(/filename="?(.*?)"?$/i)
      const fileName = matchedName?.[1] || `students-${semesterFilter || 'all-semesters'}.xlsx`
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to export students right now.'))
    } finally {
      setExportingStudents(false)
    }
  }

  const getStudentExportParams = () => {
    const params = {}

    if (semesterFilter === 'graduate') {
      params.graduated = 'true'
    } else if (semesterFilter) {
      params.semester = semesterFilter
      params.graduated = 'false'
    }

    return params
  }

  const handleDownloadIdUpdateTemplate = async () => {
    try {
      setError('')
      const response = await api.get('/admin/users/students/id-template', {
        params: getStudentExportParams(),
        responseType: 'blob'
      })
      const contentDisposition = response.headers['content-disposition'] || ''
      const matchedName = contentDisposition.match(/filename="?(.*?)"?$/i)
      const fileName = matchedName?.[1] || `student-id-update-template-${semesterFilter || 'all-semesters'}.xlsx`
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to download Student ID update template right now.'))
    }
  }

  const openIdUpdateModal = () => {
    setError('')
    setIdUpdateFile(null)
    setIdUpdateResult(null)
    setShowIdUpdateModal(true)
  }

  const handleUploadStudentIdUpdates = async () => {
    if (!idUpdateFile) {
      setError('Please choose a CSV or XLSX file with Student ID updates.')
      return
    }

    const formData = new FormData()
    formData.append('file', idUpdateFile)

    try {
      setUpdatingStudentIds(true)
      setError('')
      const response = await api.post('/admin/users/students/update-ids', formData)
      setIdUpdateResult(response.data)
      await fetchUsers()
      showToast({
        title: 'Student IDs updated.',
        description: response.data?.message || 'Student ID update completed.'
      })
    } catch (requestError) {
      setIdUpdateResult(requestError?.response?.data || null)
      setError(getFriendlyErrorMessage(requestError, 'Unable to update Student IDs right now.'))
    } finally {
      setUpdatingStudentIds(false)
    }
  }

  return (
    <Layout>
      <div className={pageClassName}>

        <PageHeader
          title="Users"
          subtitle={isCoordinator ? 'Manage instructors, gate staff, and students in your department with clean operational controls.' : 'Manage all users in TriLearn'}
          breadcrumbs={[isCoordinator ? 'Coordinator' : 'Admin', 'Users']}
          actions={[
            ...(isCoordinator
              ? [
                  { label: 'Add Instructor', icon: UserPlus, variant: 'primary', onClick: () => openModal('instructor') },
                  { label: 'Add Gate Account', icon: UserPlus, variant: 'primary', onClick: () => openModal('gatekeeper') }
                ]
              : [
                  { label: 'Add Coordinator', icon: UserPlus, variant: 'primary', onClick: () => openModal('coordinator') },
                  { label: 'Add Instructor', icon: UserPlus, variant: 'primary', onClick: () => openModal('instructor') },
                  { label: 'Add Gate Account', icon: UserPlus, variant: 'primary', onClick: () => openModal('gatekeeper') }
                ]),
            { label: 'Add Student', icon: UserPlus, variant: 'primary', onClick: () => openModal('student') }
          ]}
        />

        {/* Success/Error messages */}
        <Alert type="error" message={error} />

        <UserFilters
          isCoordinator={isCoordinator}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          semesterFilter={semesterFilter}
          setSemesterFilter={setSemesterFilter}
          semesterFilterOptions={semesterFilterOptions}
          visibleRoles={visibleRoles}
          bulkSectionForm={bulkSectionForm}
          setBulkSectionForm={setBulkSectionForm}
          departments={departments}
          academicSemesterOptions={academicSemesterOptions}
          getSectionOptions={getSectionOptions}
          selectedStudentIds={selectedStudentIds}
          bulkAssigningSection={bulkAssigningSection}
          handleBulkAssignStudentSection={handleBulkAssignStudentSection}
          openImportModal={openImportModal}
          exportingStudents={exportingStudents}
          handleExportStudents={handleExportStudents}
          handleDownloadIdUpdateTemplate={handleDownloadIdUpdateTemplate}
          openIdUpdateModal={openIdUpdateModal}
          showStudentTools={false}
        />

        <UserTable
          loading={loading}
          users={users}
          total={total}
          page={page}
          limit={limit}
          setPage={setPage}
          filterRole={filterRole}
          openModal={openModal}
          studentsOnPage={studentsOnPage}
          selectedStudentIds={selectedStudentIds}
          handleToggleAllStudentsOnPage={handleToggleAllStudentsOnPage}
          handleToggleStudentSelection={handleToggleStudentSelection}
          openStudentSectionModal={openStudentSectionModal}
          setStudentToPromote={setStudentToPromote}
          canToggleStatus={canToggleStatus}
          handleToggleStatus={handleToggleStatus}
          currentUser={currentUser}
          setUserToDelete={setUserToDelete}
        />

      </div>

      {showModal && (
        <CreateUserModal
          modalType={modalType}
          onClose={() => setShowModal(false)}
          error={error}
          handleSubmit={handleSubmit}
          handleCreateUser={handleCreateUser}
          values={values}
          errors={errors}
          handleChange={handleChange}
          departments={departments}
          handleInstructorDepartmentToggle={handleInstructorDepartmentToggle}
          academicSemesterOptions={academicSemesterOptions}
          getSectionOptions={getSectionOptions}
        />
      )}

      {showImportModal && (
        <Modal
          title="Import Students"
          onClose={() => {
            if (!importingStudents) {
              setShowImportModal(false)
            }
          }}
        >
          <Alert type="error" message={error} />

          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
              Use a CSV or XLSX file with these columns: `name`, `email`, `studentId`, `department`, `semester`, `section`.
              Optional columns: `phone`, `address`. Department can match either the department name or code.
              <button
                type="button"
                onClick={downloadStudentImportTemplate}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-surface-subtle)]"
              >
                <Download className="h-4 w-4" />
                Download CSV template
              </button>
            </div>

            <label className="ui-form-file">
              <input
                type="file"
                accept=".csv,.xlsx"
                className="ui-form-file-input"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null
                  setImportFile(nextFile)
                  setImportResult(null)
                }}
              />
              <span>{importFile ? `${importFile.name} selected` : 'Choose a CSV or XLSX file'}</span>
            </label>

            {importResult && !importResult.summary ? (
              <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 text-sm text-[var(--color-text-muted)]">
                <p className="font-semibold text-[var(--color-heading)]">{importResult.message || 'Student import status'}</p>
                {importResult.state ? (
                  <p className="mt-2">Status: <span className="font-medium text-[var(--color-heading)]">{importResult.state}</span></p>
                ) : null}
                {importResult.jobId ? (
                  <p className="mt-1">Job ID: <span className="font-medium text-[var(--color-heading)]">{importResult.jobId}</span></p>
                ) : null}
              </div>
            ) : null}

            {importResult?.summary ? (
              <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-soft)]">Processed</p>
                    <p className="mt-2 text-2xl font-black text-[var(--color-heading)]">{importResult.summary.processed || 0}</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 px-4 py-3 dark:bg-primary-950/20">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary">Created</p>
                    <p className="mt-2 text-2xl font-black text-primary">{importResult.summary.created || 0}</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 px-4 py-3 dark:bg-accent-950/20">
                    <p className="text-xs uppercase tracking-[0.2em] text-accent-700 dark:text-accent-300">Failed</p>
                    <p className="mt-2 text-2xl font-black text-accent-700 dark:text-accent-300">{importResult.summary.failed || 0}</p>
                  </div>
                </div>

                {Array.isArray(importResult.created) && importResult.created.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[var(--color-heading)]">Created accounts</p>
                    <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-[var(--color-surface-muted)] p-3">
                      {importResult.created.map((student) => (
                        <div key={`${student.rowNumber}-${student.studentId}`} className="rounded-lg bg-[var(--color-card-surface)] px-3 py-3 text-sm">
                          <p className="font-semibold text-[var(--color-heading)]">{student.name} · {student.studentId}</p>
                          <p className="mt-1 text-[var(--color-text-muted)]">{student.email}</p>
                          <p className="mt-1 text-[var(--color-text-muted)]">
                            Welcome email: <span className="font-medium text-[var(--color-heading)]">{student.welcomeEmailSent ? 'Sent' : 'Pending / failed'}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(importResult.failures) && importResult.failures.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[var(--color-heading)]">Failed rows</p>
                    <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-[var(--color-surface-muted)] p-3">
                      {importResult.failures.map((failure) => (
                        <div key={`${failure.rowNumber}-${failure.studentId || failure.email || failure.message}`} className="rounded-lg bg-[var(--color-card-surface)] px-3 py-3 text-sm">
                          <p className="font-semibold text-[var(--color-heading)]">Row {failure.rowNumber}</p>
                          <p className="mt-1 text-[var(--color-text-muted)]">{failure.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="ui-modal-footer">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importingStudents}
                className="flex-1 border border-[--color-border] dark:border-slate-700 text-[--color-text-muted] dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-[--color-bg] dark:bg-slate-900 disabled:opacity-60"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleImportStudents()
                }}
                disabled={!importFile || importingStudents}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary font-medium disabled:opacity-60"
              >
                {importingStudents ? 'Importing...' : 'Import Students'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showIdUpdateModal && (
        <Modal
          title="Bulk Update Student IDs"
          onClose={() => {
            if (!updatingStudentIds) {
              setShowIdUpdateModal(false)
            }
          }}
        >
          <Alert type="error" message={error} />

          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
              Download the template for the selected semester, fill only `newStudentId`, then upload it here. If any row has an error, no Student IDs are changed.
              <button
                type="button"
                onClick={() => {
                  void handleDownloadIdUpdateTemplate()
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-surface-subtle)]"
              >
                <Download className="h-4 w-4" />
                Download ID template
              </button>
            </div>

            <label className="ui-form-file">
              <input
                type="file"
                accept=".csv,.xlsx"
                className="ui-form-file-input"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null
                  setIdUpdateFile(nextFile)
                  setIdUpdateResult(null)
                }}
              />
              <span>{idUpdateFile ? `${idUpdateFile.name} selected` : 'Choose completed CSV or XLSX file'}</span>
            </label>

            {idUpdateResult?.summary ? (
              <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-soft)]">Processed</p>
                    <p className="mt-2 text-2xl font-black text-[var(--color-heading)]">{idUpdateResult.summary.processed || 0}</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 px-4 py-3 dark:bg-primary-950/20">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary">Updated</p>
                    <p className="mt-2 text-2xl font-black text-primary">{idUpdateResult.summary.updated || 0}</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 px-4 py-3 dark:bg-accent-950/20">
                    <p className="text-xs uppercase tracking-[0.2em] text-accent-700 dark:text-accent-300">Failed</p>
                    <p className="mt-2 text-2xl font-black text-accent-700 dark:text-accent-300">{idUpdateResult.summary.failed || 0}</p>
                  </div>
                </div>

                {Array.isArray(idUpdateResult.failures) && idUpdateResult.failures.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[var(--color-heading)]">Failed rows</p>
                    <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-xl bg-[var(--color-surface-muted)] p-3">
                      {idUpdateResult.failures.map((failure) => (
                        <div key={`${failure.rowNumber}-${failure.currentStudentId}-${failure.newStudentId}`} className="rounded-lg bg-[var(--color-card-surface)] px-3 py-3 text-sm">
                          <p className="font-semibold text-[var(--color-heading)]">Row {failure.rowNumber}</p>
                          <p className="mt-1 text-[var(--color-text-muted)]">{failure.currentStudentId || '-'} to {failure.newStudentId || '-'}</p>
                          <p className="mt-1 text-[var(--color-text-muted)]">{failure.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="ui-modal-footer">
              <button
                type="button"
                onClick={() => setShowIdUpdateModal(false)}
                disabled={updatingStudentIds}
                className="flex-1 rounded-lg border border-[var(--color-card-border)] py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] disabled:opacity-60"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleUploadStudentIdUpdates()
                }}
                disabled={!idUpdateFile || updatingStudentIds}
                className="ui-role-fill flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-60"
              >
                {updatingStudentIds ? 'Updating...' : 'Update Student IDs'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {studentToManageSection && (
        <EditUserModal
          studentToManageSection={studentToManageSection}
          updatingStudentSection={updatingStudentSection}
          setStudentToManageSection={setStudentToManageSection}
          setStudentSectionError={setStudentSectionError}
          studentSectionError={studentSectionError}
          handleUpdateStudentSection={handleUpdateStudentSection}
          studentSectionForm={studentSectionForm}
          setStudentSectionForm={setStudentSectionForm}
          departments={departments}
          academicSemesterOptions={academicSemesterOptions}
          getSectionOptions={getSectionOptions}
        />
      )}

      <ConfirmDialog
        open={!!studentToPromote}
        title={Number(studentToPromote?.student?.semester || 0) >= 8 ? 'Mark as Graduate' : 'Promote Semester'}
        message={studentToPromote
          ? Number(studentToPromote.student?.semester || 0) >= 8
            ? `Mark ${studentToPromote.name} as graduated for ${new Date().getFullYear()}? Use this after semester 8 has been fully completed.`
            : `Move ${studentToPromote.name} from semester ${studentToPromote.student?.semester} to semester ${Number(studentToPromote.student?.semester || 0) + 1}? This should be used only after the current semester has ended.`
          : ''}
        confirmText={Number(studentToPromote?.student?.semester || 0) >= 8 ? 'Mark Graduate' : 'Promote Student'}
        tone="primary"
        busy={promotingStudent}
        onClose={() => setStudentToPromote(null)}
        onConfirm={handlePromoteSemester}
      />

      <ConfirmDialog
        open={!!userToDelete}
        title="Delete User"
        message={userToDelete
          ? `Delete ${userToDelete.name}? This action permanently removes the account and related profile data.`
          : ''}
        confirmText="Delete User"
        busy={deletingUser}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
      />
    </Layout>
  )
}

export default Users



