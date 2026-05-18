import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, DoorOpen, Layers, Pencil, Plus, Save, UserCheck, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import CoordinatorLayout from '../../layouts/CoordinatorLayout'
import api from '../../utils/api'
import Alert from '../../components/Alert'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import { useReferenceData } from '../../context/ReferenceDataContext'
import logger from '../../utils/logger'
import { isRequestCanceled } from '../../utils/http'
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_SHORT = { SUNDAY: 'Sun', MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' }
const getInstructorDepartments = (instructor) => (
  Array.isArray(instructor?.instructor?.departments) && instructor.instructor.departments.length > 0
    ? instructor.instructor.departments
    : [instructor?.instructor?.department].filter(Boolean)
)

const SEMESTER_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1))
const generateCombinedGroupId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return null
}

const minutesFromTime = (value) => {
  const [hours, minutes] = String(value || '').split(':').map((part) => Number.parseInt(part, 10))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return (hours * 60) + minutes
}

const timeRangesOverlap = (leftStart, leftEnd, rightStart, rightEnd) => {
  const leftStartMinutes = minutesFromTime(leftStart)
  const leftEndMinutes = minutesFromTime(leftEnd)
  const rightStartMinutes = minutesFromTime(rightStart)
  const rightEndMinutes = minutesFromTime(rightEnd)

  if ([leftStartMinutes, leftEndMinutes, rightStartMinutes, rightEndMinutes].some((value) => value === null)) {
    return false
  }

  return leftStartMinutes < rightEndMinutes && rightStartMinutes < leftEndMinutes
}

const formatSectionLabel = (section) => section || 'All sections'

const defaultForm = {
  subjectId: '',
  instructorId: '',
  department: '',
  semester: '',
  section: '',
  dayOfWeek: 'SUNDAY',
  startTime: '08:00',
  endTime: '09:00',
  room: ''
}

const AdminRoutine = () => {
  const { user } = useAuth()
  const { departments, loadDepartments } = useReferenceData()
  const isCoordinator = user?.role === ROLES.COORDINATOR
  const Layout = isCoordinator ? CoordinatorLayout : AdminLayout
  const [routines, setRoutines] = useState([])
  const [subjects, setSubjects] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRoutine, setEditRoutine] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [createSectionScope, setCreateSectionScope] = useState('ONE')
  const [createSectionsInput, setCreateSectionsInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const pageClassName = `${isCoordinator ? 'coordinator-page' : 'admin-page'} p-4 md:p-8`

  const resetBuilder = useCallback(() => {
    setEditRoutine(null)
    setForm(defaultForm)
    setCreateSectionScope('ONE')
    setCreateSectionsInput('')
    setError('')
  }, [])

  const fetchRoutines = async (signal) => {
    try {
      setLoading(true)
      const res = await api.get('/routines', { signal })
      setRoutines(res.data.routines)
    } catch (err) {
      if (isRequestCanceled(err)) return
      logger.error(err)
      setError(err.response?.data?.message || 'Unable to load routine entries right now.')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const fetchSubjects = async (signal) => {
    try {
      const res = await api.get('/subjects', {
        signal,
        params: { limit: 100 }
      })
      setSubjects(res.data.subjects || [])
    } catch (err) {
      if (isRequestCanceled(err)) return
      logger.error(err)
    }
  }

  const fetchInstructors = useCallback(async (signal) => {
    try {
      const res = await api.get('/admin/users', {
        signal,
        params: {
          role: ROLES.INSTRUCTOR,
          limit: 100,
          ...(isCoordinator ? { includeAssignable: true } : {})
        }
      })
      setInstructors((res.data.users || []).filter((item) => item.instructor?.id))
    } catch (err) {
      if (isRequestCanceled(err)) return
      logger.error(err)
      setError(err.response?.data?.message || 'Unable to load instructors right now.')
    }
  }, [isCoordinator])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.allSettled([
      fetchRoutines(controller.signal),
      fetchSubjects(controller.signal),
      fetchInstructors(controller.signal),
      loadDepartments({ signal: controller.signal })
    ])
    return () => controller.abort()
  }, [fetchInstructors, loadDepartments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (hasInvalidTimeRange) {
      setError('End time must be after start time.')
      return
    }

    if (scheduleConflicts.length > 0) {
      setError('Resolve the highlighted room, instructor, or section conflict before saving this routine.')
      return
    }

    try {
      const basePayload = {
        ...form,
        semester: Number(form.semester)
      }

      if (editRoutine) {
        await api.put(`/routines/${editRoutine.id}`, {
          ...basePayload,
          section: form.section.trim()
        })
        setSuccess('Routine updated!')
      } else {
        const combinedGroupId = createSectionScope === 'MULTIPLE' ? generateCombinedGroupId() : null
        const sectionTargets = createSectionScope === 'MULTIPLE'
          ? [...new Set(
            createSectionsInput
              .split(',')
              .map((value) => value.trim().toUpperCase())
              .filter(Boolean)
          )]
          : [createSectionScope === 'ONE' ? form.section.trim().toUpperCase() : '']

        const createResults = await Promise.allSettled(
          sectionTargets.map((section) => api.post('/routines', {
            ...basePayload,
            section,
            combinedGroupId: combinedGroupId || undefined
          }))
        )

        const failedResults = createResults.filter((result) => result.status === 'rejected')
        const createdCount = createResults.length - failedResults.length

        if (failedResults.length > 0 && createdCount === 0) {
          throw failedResults[0].reason
        }

        if (failedResults.length > 0) {
          const firstFailure = failedResults[0]?.reason?.response?.data?.message || 'Some section entries could not be created.'
          setSuccess(`Created ${createdCount} routine entries.`)
          setError(firstFailure)
        } else {
          setSuccess(createdCount > 1 ? `Created ${createdCount} routine entries!` : 'Routine created!')
        }
      }
      setShowModal(false)
      resetBuilder()
      fetchRoutines()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const normalizeValue = useCallback((value) => String(value || '').trim().toLowerCase(), [])
  const normalizeDepartmentKey = useCallback((value) => {
    const normalizedValue = normalizeValue(value)
    if (!normalizedValue) {
      return ''
    }

    const matchedDepartment = departments.find((department) => (
      normalizeValue(department.name) === normalizedValue || normalizeValue(department.code) === normalizedValue
    ))

    return matchedDepartment
      ? normalizeValue(matchedDepartment.name)
      : normalizedValue
  }, [departments, normalizeValue])

  const isCreateMode = !editRoutine

  const filteredSubjects = subjects.filter((subject) => {
    if (!form.semester) {
      return false
    }

    const semesterMatches = Number(subject.semester) === Number(form.semester)

    if (!semesterMatches) {
      return false
    }

    if (!form.department.trim()) {
      return true
    }

    return normalizeDepartmentKey(subject.department) === normalizeDepartmentKey(form.department)
  })

  const configuredSectionOptions = useMemo(() => {
    const selectedDepartment = departments.find((department) => department.name === form.department)
    if (!selectedDepartment || !form.semester) {
      return []
    }

    const semesterEntry = (selectedDepartment.semesterSections || [])
      .find((entry) => String(entry.semester) === String(form.semester))

    if (!semesterEntry || !Array.isArray(semesterEntry.sections)) {
      return []
    }

    return [...new Set(
      semesterEntry.sections
        .map((section) => String(section || '').trim().toUpperCase())
        .filter(Boolean)
    )].sort((left, right) => left.localeCompare(right))
  }, [departments, form.department, form.semester])

  const sectionOptionsForCreate = useMemo(() => (
    [...new Set([
      ...configuredSectionOptions,
      ...routines
        .filter((routine) => (
          normalizeDepartmentKey(routine.department) === normalizeDepartmentKey(form.department)
          && String(routine.semester) === String(form.semester)
          && routine.section
        ))
        .map((routine) => routine.section.trim().toUpperCase())
      .filter(Boolean)
    ])].sort((left, right) => left.localeCompare(right))
  ), [configuredSectionOptions, form.department, form.semester, normalizeDepartmentKey, routines])
  const sectionOptionsForActiveForm = isCreateMode ? configuredSectionOptions : sectionOptionsForCreate

  const filteredInstructors = instructors.filter((instructor) => {
    if (isCoordinator) {
      return true
    }

    if (!form.department.trim()) {
      return true
    }

    return getInstructorDepartments(instructor)
      .some((department) => normalizeDepartmentKey(department) === normalizeDepartmentKey(form.department))
  })

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find((item) => item.id === subjectId)
    if (!subject) {
      setForm({ ...form, subjectId })
      return
    }

    setForm({
      ...form,
      subjectId,
      department: subject.department || '',
      semester: String(subject.semester)
    })
  }

  const handleEditRoutine = (routine) => {
    setEditRoutine(routine)
    setForm({
      subjectId: routine.subjectId || '',
      instructorId: routine.instructorId || '',
      department: routine.department || '',
      semester: routine.semester ? String(routine.semester) : '',
      section: routine.section || '',
      dayOfWeek: routine.dayOfWeek || 'SUNDAY',
      startTime: routine.startTime || '08:00',
      endTime: routine.endTime || '09:00',
      room: routine.room || ''
    })
    setCreateSectionScope(routine.section ? 'ONE' : 'ALL')
    setCreateSectionsInput('')
    setError('')
    setSuccess('')
    setShowModal(false)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const parsedCreateSections = useMemo(() => ([...new Set(
    createSectionsInput
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  )]), [createSectionsInput])
  const createScopeReady = !isCreateMode
    || (
      Boolean(form.department.trim())
      && Boolean(form.semester)
      && (
        createSectionScope === 'ALL'
        || (createSectionScope === 'ONE' && Boolean(form.section.trim()))
        || (createSectionScope === 'MULTIPLE' && parsedCreateSections.length > 0)
      )
    )

  const selectedSubject = subjects.find((subject) => subject.id === form.subjectId)
  const selectedInstructor = instructors.find((instructor) => instructor.instructor?.id === form.instructorId)
  const selectedCreateSections = useMemo(() => (
    createSectionScope === 'MULTIPLE'
      ? parsedCreateSections
      : [createSectionScope === 'ONE' ? form.section.trim().toUpperCase() : '']
  ), [createSectionScope, form.section, parsedCreateSections])
  const canCheckConflicts = Boolean(
    form.dayOfWeek &&
    form.startTime &&
    form.endTime &&
    form.department &&
    form.semester
  )
  const hasInvalidTimeRange = (
    form.startTime &&
    form.endTime &&
    minutesFromTime(form.startTime) !== null &&
    minutesFromTime(form.endTime) !== null &&
    minutesFromTime(form.startTime) >= minutesFromTime(form.endTime)
  )

  const scheduleConflicts = useMemo(() => {
    if (!canCheckConflicts || hasInvalidTimeRange) {
      return []
    }

    const sectionTargets = selectedCreateSections.length > 0 ? selectedCreateSections : ['']

    return routines.flatMap((routine) => {
      if (editRoutine?.id === routine.id) {
        return []
      }

      if (routine.dayOfWeek !== form.dayOfWeek || !timeRangesOverlap(form.startTime, form.endTime, routine.startTime, routine.endTime)) {
        return []
      }

      const conflicts = []
      const routineDepartmentMatches = normalizeDepartmentKey(routine.department) === normalizeDepartmentKey(form.department)
      const routineSemesterMatches = String(routine.semester) === String(form.semester)
      const routineSection = routine.section?.trim().toUpperCase() || ''
      const sectionMatches = sectionTargets.some((section) => (
        routineDepartmentMatches &&
        routineSemesterMatches &&
        (section === routineSection || section === '' || routineSection === '')
      ))
      const roomMatches = form.room.trim() && routine.room?.trim().toLowerCase() === form.room.trim().toLowerCase()
      const instructorMatches = form.instructorId && routine.instructorId === form.instructorId

      if (roomMatches) {
        conflicts.push({
          key: `${routine.id}-room`,
          type: 'Room',
          title: `${routine.room} is already booked`,
          detail: `${routine.subject?.code || 'Class'} uses this room on ${DAY_SHORT[routine.dayOfWeek]} ${routine.startTime}-${routine.endTime}.`
        })
      }

      if (instructorMatches) {
        conflicts.push({
          key: `${routine.id}-instructor`,
          type: 'Instructor',
          title: `${routine.instructor?.user?.name || 'Instructor'} is already assigned`,
          detail: `${routine.subject?.code || 'Class'} runs on ${DAY_SHORT[routine.dayOfWeek]} ${routine.startTime}-${routine.endTime}.`
        })
      }

      if (sectionMatches) {
        conflicts.push({
          key: `${routine.id}-section`,
          type: 'Section',
          title: `${routine.department || 'General'} semester ${routine.semester} ${formatSectionLabel(routine.section)} has a class`,
          detail: `${routine.subject?.code || 'Class'} already occupies ${routine.startTime}-${routine.endTime}.`
        })
      }

      return conflicts
    })
  }, [
    canCheckConflicts,
    editRoutine?.id,
    form.dayOfWeek,
    form.department,
    form.endTime,
    form.instructorId,
    form.room,
    form.semester,
    form.startTime,
    hasInvalidTimeRange,
    normalizeDepartmentKey,
    routines,
    selectedCreateSections
  ])

  const hasBlockingConflict = scheduleConflicts.length > 0 || hasInvalidTimeRange
  const selectedScopeLabel = form.department && form.semester
    ? `${form.department} / Semester ${form.semester} / ${
        createSectionScope === 'MULTIPLE'
          ? (parsedCreateSections.join(', ') || 'Multiple sections')
          : createSectionScope === 'ONE'
            ? (form.section || 'Select section')
            : 'All sections'
      }`
    : 'Choose department, semester, and section'

  useEffect(() => {
    if (!isCreateMode || createSectionScope !== 'ONE') {
      return
    }

    if (!form.department || !form.semester) {
      return
    }

    if (configuredSectionOptions.length === 0) {
      setForm((current) => ({ ...current, section: '' }))
      return
    }

    if (!configuredSectionOptions.includes(String(form.section || '').trim().toUpperCase())) {
      setForm((current) => ({ ...current, section: configuredSectionOptions[0] }))
    }
  }, [configuredSectionOptions, createSectionScope, form.department, form.section, form.semester, isCreateMode])

  return (
    <Layout>
      <div className={pageClassName}>

        <PageHeader
          title="Class Routine"
          subtitle={isCoordinator ? 'Build and edit department schedules by semester and section with live room and instructor checks.' : 'Build and edit schedules by department, semester, section, instructor, and room.'}
          breadcrumbs={[isCoordinator ? 'Coordinator' : 'Admin', 'Routine']}
          actions={[{
            label: 'Reset Builder',
            icon: Layers,
            variant: 'secondary',
            onClick: resetBuilder
          }]}
        />

        <Alert type="success" message={success} />
        <Alert type="error" message={error} />

        {loading ? (
          <LoadingSkeleton rows={4} itemClassName="h-40" />
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mb-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-card-border)] bg-[var(--color-card-surface)] shadow-sm dark:shadow-slate-900/40">
              <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="border-b border-[var(--color-card-border)] p-4 md:p-5 xl:border-b-0 xl:border-r">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--color-text-soft)]">{editRoutine ? 'Routine Editor' : 'Routine Builder'}</p>
                      <h2 className="mt-1 text-lg font-black text-[var(--color-heading)]">{editRoutine ? 'Change selected class' : 'Select scope first'}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">{editRoutine ? 'Update the subject, instructor, time, room, or section for this routine entry.' : 'Department, semester, and section drive the available subjects, instructors, and conflict checks.'}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-heading)]">
                        {selectedScopeLabel}
                      </div>
                      {editRoutine ? (
                        <button
                          type="button"
                          onClick={resetBuilder}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--color-card-border)] px-3 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="ui-form-label">Department</label>
                      <select
                        required
                        value={form.department}
                        onChange={(e) => {
                          setForm({ ...form, department: e.target.value, subjectId: '', instructorId: '', section: '' })
                          setCreateSectionsInput('')
                        }}
                        className="ui-form-input"
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.name}>
                            {department.name}{department.code ? ` (${department.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="ui-form-label">Semester</label>
                      <select
                        required
                        value={form.semester}
                        onChange={(e) => {
                          setForm({ ...form, semester: e.target.value, subjectId: '', section: '' })
                          setCreateSectionsInput('')
                        }}
                        className="ui-form-input"
                      >
                        <option value="">Select semester</option>
                        {SEMESTER_OPTIONS.map((semester) => (
                          <option key={semester} value={semester}>Semester {semester}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="ui-form-label">Section Mode</label>
                      <select
                        value={createSectionScope}
                        onChange={(e) => {
                          setCreateSectionScope(e.target.value)
                          setForm((current) => ({ ...current, section: '' }))
                          setCreateSectionsInput('')
                        }}
                        className="ui-form-input"
                      >
                        <option value="ONE">One section</option>
                        {isCreateMode ? <option value="MULTIPLE">Combined sections</option> : null}
                        <option value="ALL">All sections entry</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="ui-form-label">Section</label>
                    {createSectionScope === 'ONE' ? (
                      sectionOptionsForActiveForm.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {sectionOptionsForActiveForm.map((section) => {
                            const selected = form.section === section
                            return (
                              <button
                                key={section}
                                type="button"
                                onClick={() => setForm((current) => ({ ...current, section }))}
                                className={`inline-flex min-h-10 items-center rounded-xl border px-4 text-sm font-semibold transition ${
                                  selected
                                    ? 'ui-role-fill border-transparent text-white'
                                    : 'border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
                                }`}
                              >
                                {section}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        editRoutine ? (
                          <input
                            type="text"
                            value={form.section}
                            onChange={(e) => setForm({ ...form, section: e.target.value.trim().toUpperCase() })}
                            className="ui-form-input"
                            placeholder="Section"
                          />
                        ) : (
                          <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                            {form.department && form.semester ? 'No sections configured for this department and semester.' : 'Select department and semester to load sections.'}
                          </div>
                        )
                      )
                    ) : null}

                    {createSectionScope === 'MULTIPLE' ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={createSectionsInput}
                          onChange={(e) => setCreateSectionsInput(e.target.value)}
                          className="ui-form-input"
                          placeholder="A, B, C"
                        />
                        {sectionOptionsForCreate.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {sectionOptionsForCreate.map((section) => {
                              const selected = parsedCreateSections.includes(section)
                              return (
                                <button
                                  key={section}
                                  type="button"
                                  onClick={() => {
                                    setCreateSectionsInput((current) => {
                                      const currentTokens = current.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean)
                                      const nextTokens = currentTokens.includes(section)
                                        ? currentTokens.filter((item) => item !== section)
                                        : [...currentTokens, section]
                                      return [...new Set(nextTokens)].join(', ')
                                    })
                                  }}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                    selected
                                      ? 'ui-role-fill border-transparent text-white'
                                      : 'border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
                                  }`}
                                >
                                  {section}
                                </button>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {createSectionScope === 'ALL' ? (
                      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                        This creates one entry visible to every section in the selected semester.
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="ui-form-label">Subject</label>
                      <select required value={form.subjectId} onChange={(e) => handleSubjectChange(e.target.value)} className="ui-form-input" disabled={!createScopeReady}>
                        <option value="">Select subject</option>
                        {filteredSubjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} - {subject.code}
                          </option>
                        ))}
                      </select>
                      {form.department && form.semester && filteredSubjects.length === 0 ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">No matching subjects for this department and semester.</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="ui-form-label">Instructor</label>
                      <select required value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} className="ui-form-input" disabled={!createScopeReady}>
                        <option value="">Select instructor</option>
                        {filteredInstructors.map((instructor) => (
                          <option key={instructor.instructor.id} value={instructor.instructor.id}>
                            {instructor.name}{getInstructorDepartments(instructor).length > 0 ? ` - ${getInstructorDepartments(instructor).join(', ')}` : ''}
                          </option>
                        ))}
                      </select>
                      {form.department && filteredInstructors.length === 0 ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">No instructors are assigned to this department.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_1.2fr]">
                    <div>
                      <label className="ui-form-label">Day</label>
                      <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="ui-form-input">
                        {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="ui-form-label">Start</label>
                      <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="ui-form-input" />
                    </div>
                    <div>
                      <label className="ui-form-label">End</label>
                      <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="ui-form-input" />
                    </div>
                    <div>
                      <label className="ui-form-label">Room</label>
                      <input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="ui-form-input" placeholder="Room 201" />
                    </div>
                  </div>
                </section>

                <aside className="p-4 md:p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><Layers className="h-4 w-4" /> Scope</div>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{selectedScopeLabel}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><UserCheck className="h-4 w-4" /> Teacher</div>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{selectedInstructor?.name || 'Not selected'}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><Clock className="h-4 w-4" /> Slot</div>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{DAY_SHORT[form.dayOfWeek]} {form.startTime}-{form.endTime}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><DoorOpen className="h-4 w-4" /> Room</div>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{form.room || 'Not assigned'}</p>
                    </div>
                  </div>

                  <div className={`mt-4 rounded-xl border p-4 ${
                    hasBlockingConflict
                      ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {hasBlockingConflict ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-black">{hasBlockingConflict ? 'Conflict found' : 'No conflict detected'}</p>
                        <p className="mt-1 text-xs leading-5 opacity-85">
                          {hasInvalidTimeRange ? 'End time must be after start time.' : scheduleConflicts.length > 0 ? 'Review the affected room, teacher, or section before saving.' : 'The selected slot is available in the loaded routine data.'}
                        </p>
                      </div>
                    </div>
                    {scheduleConflicts.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {scheduleConflicts.slice(0, 4).map((conflict) => (
                          <div key={conflict.key} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-red-800 ring-1 ring-red-100 dark:bg-red-950/30 dark:text-red-100 dark:ring-red-900/50">
                            <p className="font-bold">{conflict.type}: {conflict.title}</p>
                            <p className="mt-0.5 opacity-80">{conflict.detail}</p>
                          </div>
                        ))}
                        {scheduleConflicts.length > 4 ? (
                          <p className="text-xs font-semibold opacity-80">+{scheduleConflicts.length - 4} more conflicts</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-4">
                    <p className="text-sm font-semibold text-[var(--color-heading)]">{selectedSubject?.name || 'Subject not selected'}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{selectedSubject?.code || 'Choose a subject after selecting department and semester.'}</p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={!createScopeReady || !form.subjectId || !form.instructorId || hasBlockingConflict}
                        className="ui-role-fill inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editRoutine ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        <span>{editRoutine ? 'Update Entry' : createSectionScope === 'MULTIPLE' ? `Create ${parsedCreateSections.length || 0} Entries` : 'Create Entry'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={resetBuilder}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-card-border)] px-4 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                      >
                        {editRoutine ? 'Cancel' : 'Clear'}
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </form>

            <section className="overflow-hidden rounded-[1.5rem] border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
              <div className="flex flex-col gap-2 border-b border-[var(--color-card-border)] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--color-heading)]">Routine Entries</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Edit an existing class without recreating the routine.</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-soft)]">{routines.length} scheduled {routines.length === 1 ? 'entry' : 'entries'}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-[var(--color-surface-muted)]">
                    <tr className="text-left text-sm text-[var(--color-text-muted)]">
                      <th className="px-5 py-3">Day</th>
                      <th className="px-5 py-3">Time</th>
                      <th className="px-5 py-3">Class</th>
                      <th className="px-5 py-3">Instructor</th>
                      <th className="px-5 py-3">Scope</th>
                      <th className="px-5 py-3">Room</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routines.map((routine) => {
                      const isEditing = editRoutine?.id === routine.id
                      return (
                        <tr key={routine.id} className={`border-t border-[var(--color-card-border)] ${isEditing ? 'bg-[var(--color-surface-muted)]' : ''}`}>
                          <td className="px-5 py-3 text-sm font-semibold text-[var(--color-heading)]">{DAY_SHORT[routine.dayOfWeek] || routine.dayOfWeek}</td>
                          <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{routine.startTime} - {routine.endTime}</td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-semibold text-[var(--color-heading)]">{routine.subject?.name || 'Subject removed'}</p>
                            <p className="text-xs text-[var(--color-text-soft)]">{routine.subject?.code || '-'}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{routine.instructor?.user?.name || '-'}</td>
                          <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">
                            <p>{routine.department || 'General'} / Semester {routine.semester}</p>
                            <p className="text-xs text-[var(--color-text-soft)]">{formatSectionLabel(routine.section)}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{routine.room || '-'}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditRoutine(routine)}
                              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                                isEditing
                                  ? 'ui-role-fill text-white'
                                  : 'border border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                              {isEditing ? 'Editing' : 'Edit'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {routines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-[var(--color-text-soft)]">No routine entries have been created yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editRoutine ? 'Edit Class' : 'Add Class'}
          onClose={() => {
            setShowModal(false)
            setEditRoutine(null)
            setForm(defaultForm)
            setCreateSectionScope('ONE')
            setCreateSectionsInput('')
          }}
        >
            <Alert type="error" message={error} />
            <form onSubmit={handleSubmit} className="space-y-4">
              {isCreateMode ? (
                <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-soft)]">Creation Filters</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Choose department, semester, and section scope before creating a routine entry.</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="ui-form-label">Department</label>
                      <select
                        required
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value, subjectId: '', instructorId: '' })}
                        className="ui-form-input"
                      >
                        <option value="">Select Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.name}>
                            {department.name}{department.code ? ` (${department.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="ui-form-label">Semester</label>
                      <select
                        required
                        value={form.semester}
                        onChange={(e) => setForm({ ...form, semester: e.target.value, subjectId: '' })}
                        className="ui-form-input"
                      >
                        <option value="">Select Semester</option>
                        {SEMESTER_OPTIONS.map((semester) => (
                          <option key={semester} value={semester}>
                            Semester {semester}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="ui-form-label">Section</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCreateSectionScope('ALL')
                            setForm((current) => ({ ...current, section: '' }))
                            setCreateSectionsInput('')
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            createSectionScope === 'ALL'
                              ? 'ui-role-fill border-transparent text-white'
                              : 'border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]'
                          }`}
                        >
                          All Sections
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateSectionScope('ONE')
                            setCreateSectionsInput('')
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            createSectionScope === 'ONE'
                              ? 'ui-role-fill border-transparent text-white'
                              : 'border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]'
                          }`}
                        >
                          Specific Section
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateSectionScope('MULTIPLE')
                            setForm((current) => ({ ...current, section: '' }))
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm sm:col-span-2 ${
                            createSectionScope === 'MULTIPLE'
                              ? 'ui-role-fill border-transparent text-white'
                              : 'border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]'
                          }`}
                        >
                          Combine Multiple Sections
                        </button>
                      </div>
                      {createSectionScope === 'ONE' ? (
                        configuredSectionOptions.length > 0 ? (
                          <select
                            value={form.section}
                            onChange={(e) => setForm({ ...form, section: e.target.value })}
                            className="ui-form-input mt-3"
                          >
                            {configuredSectionOptions.map((section) => (
                              <option key={section} value={section}>{section}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-3 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                            No sections configured for this department and semester. Create sections in Departments first.
                          </div>
                        )
                      ) : null}
                      {createSectionScope === 'MULTIPLE' ? (
                        <div className="mt-3 space-y-2">
                          <input
                            type="text"
                            value={createSectionsInput}
                            onChange={(e) => setCreateSectionsInput(e.target.value)}
                            className="ui-form-input"
                            placeholder="e.g. A, B, C"
                          />
                          <p className="text-xs text-[var(--color-text-soft)]">
                            Use comma-separated sections to create the same routine for each section in one submit.
                          </p>
                          {sectionOptionsForCreate.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {sectionOptionsForCreate.map((section) => (
                                <button
                                  key={section}
                                  type="button"
                                  onClick={() => {
                                    setCreateSectionsInput((current) => {
                                      const currentTokens = current.split(',').map((item) => item.trim()).filter(Boolean)
                                      return [...new Set([...currentTokens.map((token) => token.toUpperCase()), section])].join(', ')
                                    })
                                  }}
                                  className="rounded-full border border-[var(--color-card-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                                >
                                  {section}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="ui-form-label">Department</label>
                  <input
                    type="text"
                    required
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value, subjectId: '' })}
                    className="ui-form-input"
                    placeholder="e.g. BCA"
                    readOnly={false}
                  />
                </div>
              )}

              {!isCreateMode ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="ui-form-label">Semester</label>
                    <select
                      required
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value, subjectId: '' })}
                      className="ui-form-input"
                    >
                      <option value="">Select Semester</option>
                      {SEMESTER_OPTIONS.map((semester) => (
                        <option key={semester} value={semester}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ui-form-label">Section</label>
                    <input
                      type="text"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      className="ui-form-input"
                      placeholder="Leave blank for all sections"
                    />
                  </div>
                </div>
              ) : null}

              {!createScopeReady ? (
                <p className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                  Complete department, semester, and section selection to start creating routine details.
                </p>
              ) : (
                <>
                  <div>
                    <label className="ui-form-label">Subject</label>
                    <select required value={form.subjectId} onChange={(e) => handleSubjectChange(e.target.value)} className="ui-form-input">
                      <option value="">Select Subject</option>
                      {filteredSubjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.code} — {s.department || 'General'} — Semester {s.semester}
                        </option>
                      ))}
                    </select>
                    {form.department && filteredSubjects.length === 0 ? (
                      <p className="status-late mt-2 inline-flex rounded-lg px-2 py-1 text-xs">No subjects match this department and semester yet.</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="ui-form-label">Instructor</label>
                    <select required value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} className="ui-form-input">
                      <option value="">Select Instructor</option>
                      {filteredInstructors.map(i => (
                        <option key={i.instructor.id} value={i.instructor.id}>
                          {i.name} {getInstructorDepartments(i).length > 0 ? `— ${getInstructorDepartments(i).join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                    {form.department && filteredInstructors.length === 0 ? (
                      <p className="status-late mt-2 inline-flex rounded-lg px-2 py-1 text-xs">No instructors are available for this department yet.</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="ui-form-label">Day Of Week</label>
                    <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="ui-form-input">
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="ui-form-label">Start Time</label>
                      <input type="time" required value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="ui-form-input" />
                    </div>
                    <div className="flex-1">
                      <label className="ui-form-label">End Time</label>
                      <input type="time" required value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="ui-form-input" />
                    </div>
                  </div>
                  <div>
                    <label className="ui-form-label">Room / Location</label>
                    <input type="text"
                      value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                      className="ui-form-input" />
                  </div>
                </>
              )}

              <div className="ui-modal-footer">
                <button type="button" onClick={() => {
                  setShowModal(false)
                  setEditRoutine(null)
                  setForm(defaultForm)
                  setCreateSectionScope('ONE')
                  setCreateSectionsInput('')
                }}
                  className="flex-1 rounded-lg border border-[var(--color-card-border)] py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">Cancel</button>
                <button type="submit"
                  disabled={!createScopeReady || hasBlockingConflict}
                  className="ui-role-fill flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  <span>{editRoutine ? 'Update' : createSectionScope === 'MULTIPLE' ? `Add Classes (${parsedCreateSections.length || 0})` : 'Add Class'}</span>
                </button>
              </div>
            </form>
        </Modal>
      )}
    </Layout>
  )
}

export default AdminRoutine


