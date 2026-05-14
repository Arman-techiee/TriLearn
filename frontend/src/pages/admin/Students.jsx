import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import CoordinatorLayout from '../../layouts/CoordinatorLayout'
import Alert from '../../components/Alert'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { useReferenceData } from '../../context/ReferenceDataContext'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import api from '../../utils/api'
import { getFriendlyErrorMessage } from '../../utils/errors'
import { isRequestCanceled } from '../../utils/http'
import logger from '../../utils/logger'
import { ROLES } from '../../constants/roles'

const academicSemesterOptions = Array.from({ length: 8 }, (_, index) => String(index + 1))
const STUDENT_IMPORT_POLL_INTERVAL_MS = 1500
const STUDENT_IMPORT_MAX_POLL_ATTEMPTS = 40

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms)
})

const normalizeApiStatusPath = (statusUrl) => (
  String(statusUrl || '').replace(/^\/api\/v\d+/i, '') || statusUrl
)

const downloadBlobResponse = (response, fallbackName) => {
  const contentDisposition = response.headers['content-disposition'] || ''
  const matchedName = contentDisposition.match(/filename="?(.*?)"?$/i)
  const fileName = matchedName?.[1] || fallbackName
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

const escapeCsvCell = (value) => {
  const stringValue = String(value ?? '')
  if (!/[",\r\n]/.test(stringValue)) return stringValue
  return `"${stringValue.replace(/"/g, '""')}"`
}

const downloadStudentImportTemplate = () => {
  const rows = [
    ['name', 'email', 'studentId', 'department', 'semester', 'section', 'phone', 'address'],
    ['Asha Sharma', 'asha@example.edu', 'CS-001', 'CS', '1', 'A', '9800000000', 'Kathmandu']
  ]
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'trilearn-student-import-template.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const Students = () => {
  const { user } = useAuth()
  const { departments } = useReferenceData()
  const { showToast } = useToast()
  const isCoordinator = user?.role === ROLES.COORDINATOR
  const Layout = isCoordinator ? CoordinatorLayout : AdminLayout
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [semester, setSemester] = useState('')
  const [section, setSection] = useState('')
  const [exporting, setExporting] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showIdUpdateModal, setShowIdUpdateModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [idUpdateFile, setIdUpdateFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [updatingIds, setUpdatingIds] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [idUpdateResult, setIdUpdateResult] = useState(null)
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  const sectionOptions = useMemo(() => {
    if (!semester) return []
    const sections = departments.flatMap((department) => (
      (department.semesterSections || [])
        .filter((entry) => String(entry.semester) === String(semester))
        .flatMap((entry) => entry.sections || [])
    ))
    return [...new Set(sections)].sort()
  }, [departments, semester])

  useEffect(() => {
    if (section && !sectionOptions.includes(section)) {
      setSection('')
    }
  }, [section, sectionOptions])

  const buildStudentParams = useCallback((includePagination = true) => {
    const params = new URLSearchParams()
    if (includePagination) {
      params.set('page', String(page))
      params.set('limit', String(limit))
    }
    params.set('role', ROLES.STUDENT)
    params.set('graduated', 'false')
    if (semester) params.set('semester', semester)
    if (section) params.set('section', section)
    if (debouncedSearchTerm.trim()) params.set('search', debouncedSearchTerm.trim())
    return params
  }, [debouncedSearchTerm, limit, page, section, semester])

  const fetchStudents = useCallback(async (signal) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/admin/users?${buildStudentParams().toString()}`, { signal })
      setStudents(response.data.users || [])
      setTotal(response.data.total || 0)
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return
      logger.error(requestError)
      setError(getFriendlyErrorMessage(requestError, 'Unable to load students right now.'))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [buildStudentParams])

  useEffect(() => {
    const controller = new AbortController()
    void fetchStudents(controller.signal)
    return () => controller.abort()
  }, [fetchStudents])

  const exportParams = () => {
    const params = {}
    if (semester) params.semester = semester
    if (section) params.section = section
    params.graduated = 'false'
    return params
  }

  const handleExportStudents = async () => {
    try {
      setExporting('students')
      setError('')
      const response = await api.get('/admin/users/students/export', {
        params: exportParams(),
        responseType: 'blob'
      })
      downloadBlobResponse(response, `students-${semester || 'all'}${section ? `-${section}` : ''}.xlsx`)
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to export students right now.'))
    } finally {
      setExporting('')
    }
  }

  const handleDownloadIdTemplate = async () => {
    try {
      setExporting('ids')
      setError('')
      const response = await api.get('/admin/users/students/id-template', {
        params: exportParams(),
        responseType: 'blob'
      })
      downloadBlobResponse(response, `student-id-update-template-${semester || 'all'}.xlsx`)
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to download Student ID template right now.'))
    } finally {
      setExporting('')
    }
  }

  const handleImportStudents = async () => {
    if (!importFile) {
      setError('Please choose a CSV or XLSX file to import.')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)

    try {
      setImporting(true)
      setError('')
      const response = await api.post('/admin/users/student-import', formData)
      let data = response.data

      if (response.status === 202 && response.data?.statusUrl) {
        const statusPath = normalizeApiStatusPath(response.data.statusUrl)
        for (let attempt = 0; attempt < STUDENT_IMPORT_MAX_POLL_ATTEMPTS; attempt += 1) {
          await wait(STUDENT_IMPORT_POLL_INTERVAL_MS)
          const jobResponse = await api.get(statusPath)
          const job = jobResponse.data
          setImportResult({ message: response.data.message, state: job.state, progress: job.progress })
          if (job.state === 'completed') {
            data = job.result
            break
          }
          if (job.state === 'failed') {
            throw new Error(job.result?.message || job.failedReason || 'Student import failed.')
          }
        }
      }

      setImportResult(data)
      await fetchStudents()
      showToast({ title: 'Student import completed.' })
    } catch (requestError) {
      setImportResult(requestError?.response?.data || null)
      setError(getFriendlyErrorMessage(requestError, 'Unable to import students right now.'))
    } finally {
      setImporting(false)
    }
  }

  const handleUploadStudentIdUpdates = async () => {
    if (!idUpdateFile) {
      setError('Please choose a CSV or XLSX file with Student ID updates.')
      return
    }

    const formData = new FormData()
    formData.append('file', idUpdateFile)

    try {
      setUpdatingIds(true)
      setError('')
      const response = await api.post('/admin/users/students/update-ids', formData)
      setIdUpdateResult(response.data)
      await fetchStudents()
      showToast({ title: 'Student IDs updated.', description: response.data?.message })
    } catch (requestError) {
      setIdUpdateResult(requestError?.response?.data || null)
      setError(getFriendlyErrorMessage(requestError, 'Unable to update Student IDs right now.'))
    } finally {
      setUpdatingIds(false)
    }
  }

  const pageClassName = `${isCoordinator ? 'coordinator-page' : 'admin-page'} p-4 md:p-8`

  return (
    <Layout>
      <div className={pageClassName}>
        <PageHeader
          title="Students"
          subtitle="View students by semester and section, export alphabetical rosters, import students, and update Student IDs in bulk."
          breadcrumbs={[isCoordinator ? 'Coordinator' : 'Admin', 'Students']}
          actions={[
            { label: 'Import Students', icon: Upload, variant: 'secondary', onClick: () => setShowImportModal(true) },
            { label: exporting === 'students' ? 'Exporting...' : 'Export List', icon: Download, variant: 'secondary', disabled: Boolean(exporting), onClick: () => { void handleExportStudents() } },
            { label: exporting === 'ids' ? 'Downloading...' : 'ID Template', icon: FileSpreadsheet, variant: 'secondary', disabled: Boolean(exporting), onClick: () => { void handleDownloadIdTemplate() } },
            { label: 'Upload ID Updates', icon: Upload, variant: 'primary', onClick: () => setShowIdUpdateModal(true) }
          ]}
        />

        <Alert type="error" message={error} />

        <section className="mb-6 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4 shadow-sm dark:shadow-slate-900/50">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <div>
              <label htmlFor="student-search" className="ui-form-label">Search students</label>
              <input
                id="student-search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, email, phone, Student ID, or department"
                className="ui-form-input"
              />
            </div>
            <div>
              <label htmlFor="student-semester" className="ui-form-label">Semester</label>
              <select
                id="student-semester"
                value={semester}
                onChange={(event) => {
                  setSemester(event.target.value)
                  setPage(1)
                }}
                className="ui-form-input"
              >
                <option value="">All semesters</option>
                {academicSemesterOptions.map((option) => (
                  <option key={option} value={option}>Semester {option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="student-section" className="ui-form-label">Section</label>
              <select
                id="student-section"
                value={section}
                onChange={(event) => {
                  setSection(event.target.value)
                  setPage(1)
                }}
                disabled={!semester || sectionOptions.length === 0}
                className="ui-form-input"
              >
                <option value="">All sections</option>
                {sectionOptions.map((option) => (
                  <option key={option} value={option}>Section {option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-[var(--color-card-surface)] shadow-sm dark:shadow-slate-900/50">
          <div className="flex items-center justify-between border-b border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-heading)]">Student roster</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Export order is alphabetical by student name.</p>
            </div>
            <span className="ui-status-badge ui-status-neutral">{total} students</span>
          </div>
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={6} itemClassName="h-16" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-[var(--color-surface-muted)] text-left text-sm text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Student ID</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Semester</th>
                      <th className="px-6 py-4">Section</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((studentUser) => (
                      <tr key={studentUser.id} className="border-t border-[var(--color-card-border)]">
                        <td className="px-6 py-4 font-semibold text-[var(--color-heading)]">{studentUser.name}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{studentUser.student?.rollNumber || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{studentUser.student?.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{studentUser.student?.semester || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{studentUser.student?.section || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{studentUser.email}</td>
                        <td className="px-6 py-4"><span className={`ui-status-badge ${studentUser.isActive ? 'ui-status-success' : 'ui-status-danger'}`}>{studentUser.isActive ? 'Active' : 'Disabled'}</span></td>
                      </tr>
                    ))}
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">No students found for the selected filters.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>

      {showImportModal ? (
        <Modal title="Import Students" onClose={() => !importing && setShowImportModal(false)}>
          <Alert type="error" message={error} />
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
              Upload CSV/XLSX with `name`, `email`, `studentId`, `department`, `semester`, and `section`.
              <button type="button" onClick={downloadStudentImportTemplate} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-heading)]">
                <Download className="h-4 w-4" /> Download CSV template
              </button>
            </div>
            <label className="ui-form-file">
              <input type="file" accept=".csv,.xlsx" className="ui-form-file-input" onChange={(event) => setImportFile(event.target.files?.[0] || null)} />
              <span>{importFile ? `${importFile.name} selected` : 'Choose a CSV or XLSX file'}</span>
            </label>
            {importResult?.summary ? (
              <ResultSummary result={importResult} createdLabel="Created" />
            ) : null}
            <div className="ui-modal-footer">
              <button type="button" onClick={() => setShowImportModal(false)} disabled={importing} className="flex-1 rounded-lg border border-[var(--color-card-border)] py-2 text-sm text-[var(--color-text-muted)]">Close</button>
              <button type="button" onClick={() => { void handleImportStudents() }} disabled={!importFile || importing} className="ui-role-fill flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-60">{importing ? 'Importing...' : 'Import Students'}</button>
            </div>
          </div>
        </Modal>
      ) : null}

      {showIdUpdateModal ? (
        <Modal title="Bulk Update Student IDs" onClose={() => !updatingIds && setShowIdUpdateModal(false)}>
          <Alert type="error" message={error} />
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
              Download the ID template, fill `newStudentId`, then upload it. If any row fails validation, no IDs are changed.
              <button type="button" onClick={() => { void handleDownloadIdTemplate() }} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-heading)]">
                <Download className="h-4 w-4" /> Download ID template
              </button>
            </div>
            <label className="ui-form-file">
              <input type="file" accept=".csv,.xlsx" className="ui-form-file-input" onChange={(event) => setIdUpdateFile(event.target.files?.[0] || null)} />
              <span>{idUpdateFile ? `${idUpdateFile.name} selected` : 'Choose completed CSV or XLSX file'}</span>
            </label>
            {idUpdateResult?.summary ? (
              <ResultSummary result={idUpdateResult} createdLabel="Updated" />
            ) : null}
            <div className="ui-modal-footer">
              <button type="button" onClick={() => setShowIdUpdateModal(false)} disabled={updatingIds} className="flex-1 rounded-lg border border-[var(--color-card-border)] py-2 text-sm text-[var(--color-text-muted)]">Close</button>
              <button type="button" onClick={() => { void handleUploadStudentIdUpdates() }} disabled={!idUpdateFile || updatingIds} className="ui-role-fill flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-60">{updatingIds ? 'Updating...' : 'Update Student IDs'}</button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Layout>
  )
}

const ResultSummary = ({ result, createdLabel }) => (
  <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-soft)]">Processed</p>
        <p className="mt-2 text-2xl font-black text-[var(--color-heading)]">{result.summary.processed || 0}</p>
      </div>
      <div className="rounded-xl bg-primary-50 px-4 py-3 dark:bg-primary-950/20">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{createdLabel}</p>
        <p className="mt-2 text-2xl font-black text-primary">{result.summary.created || result.summary.updated || 0}</p>
      </div>
      <div className="rounded-xl bg-accent-50 px-4 py-3 dark:bg-accent-950/20">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-700 dark:text-accent-300">Failed</p>
        <p className="mt-2 text-2xl font-black text-accent-700 dark:text-accent-300">{result.summary.failed || 0}</p>
      </div>
    </div>
    {Array.isArray(result.failures) && result.failures.length > 0 ? (
      <div className="mt-4 max-h-52 space-y-2 overflow-y-auto rounded-xl bg-[var(--color-surface-muted)] p-3">
        {result.failures.map((failure) => (
          <div key={`${failure.rowNumber}-${failure.studentId || failure.currentStudentId || failure.email || failure.message}`} className="rounded-lg bg-[var(--color-card-surface)] px-3 py-3 text-sm">
            <p className="font-semibold text-[var(--color-heading)]">Row {failure.rowNumber}</p>
            <p className="mt-1 text-[var(--color-text-muted)]">{failure.message}</p>
          </div>
        ))}
      </div>
    ) : null}
  </div>
)

export default Students
