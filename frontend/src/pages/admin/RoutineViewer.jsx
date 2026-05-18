import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Filter, Layers, Users } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import CoordinatorLayout from '../../layouts/CoordinatorLayout'
import Alert from '../../components/Alert'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useReferenceData } from '../../context/ReferenceDataContext'
import { ROLES } from '../../constants/roles'
import api from '../../utils/api'
import logger from '../../utils/logger'
import { isRequestCanceled } from '../../utils/http'

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_SHORT = { SUNDAY: 'Sun', MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' }
const CLASS_TYPE_LABELS = { LECTURE: 'Lecture', TUTORIAL: 'Tutorial', WORKSHOP: 'Workshop' }
const formatClassType = (value) => CLASS_TYPE_LABELS[value] || 'Lecture'
const SEMESTER_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1))
const ROUTINE_TONES = [
  'routine-tone-1',
  'routine-tone-2',
  'routine-tone-3',
  'routine-tone-4',
  'routine-tone-5',
  'routine-tone-6',
  'routine-tone-7'
]

const normalize = (value) => String(value || '').trim().toLowerCase()

const RoutineViewer = () => {
  const { user } = useAuth()
  const { departments, loadDepartments } = useReferenceData()
  const isCoordinator = user?.role === ROLES.COORDINATOR
  const Layout = isCoordinator ? CoordinatorLayout : AdminLayout
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState({
    department: '',
    semester: '',
    section: ''
  })
  const pageClassName = `${isCoordinator ? 'coordinator-page' : 'admin-page'} p-4 md:p-8`

  const fetchRoutines = useCallback(async (signal) => {
    try {
      setLoading(true)
      const response = await api.get('/routines', { signal })
      setRoutines(response.data.routines || [])
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return
      logger.error(requestError)
      setError(requestError.response?.data?.message || 'Unable to load routine entries right now.')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.allSettled([
      fetchRoutines(controller.signal),
      loadDepartments({ signal: controller.signal })
    ])
    return () => controller.abort()
  }, [fetchRoutines, loadDepartments])

  const selectedDepartment = departments.find((department) => department.name === selection.department)
  const sectionOptions = useMemo(() => {
    if (!selectedDepartment || !selection.semester) {
      return []
    }

    const configured = (selectedDepartment.semesterSections || [])
      .find((entry) => String(entry.semester) === String(selection.semester))

    const configuredSections = Array.isArray(configured?.sections)
      ? configured.sections
      : []

    const routineSections = routines
      .filter((routine) => (
        normalize(routine.department) === normalize(selection.department) &&
        String(routine.semester) === String(selection.semester) &&
        routine.section
      ))
      .map((routine) => routine.section)

    return [...new Set([...configuredSections, ...routineSections]
      .map((section) => String(section || '').trim().toUpperCase())
      .filter(Boolean))]
      .sort((left, right) => left.localeCompare(right))
  }, [routines, selectedDepartment, selection.department, selection.semester])

  useEffect(() => {
    if (!selection.section || sectionOptions.includes(selection.section)) {
      return
    }

    setSelection((current) => ({ ...current, section: '' }))
  }, [sectionOptions, selection.section])

  const readyToView = Boolean(selection.department && selection.semester && selection.section)

  const visibleRoutines = useMemo(() => {
    if (!readyToView) {
      return []
    }

    return routines
      .filter((routine) => {
        const departmentMatches = normalize(routine.department) === normalize(selection.department)
        const semesterMatches = String(routine.semester) === String(selection.semester)
        const routineSection = String(routine.section || '').trim().toUpperCase()
        const sectionMatches = routineSection === selection.section || routineSection === ''

        return departmentMatches && semesterMatches && sectionMatches
      })
      .sort((left, right) => {
        const dayDiff = DAYS.indexOf(left.dayOfWeek) - DAYS.indexOf(right.dayOfWeek)
        return dayDiff !== 0 ? dayDiff : left.startTime.localeCompare(right.startTime)
      })
  }, [readyToView, routines, selection.department, selection.section, selection.semester])

  const routinesByDay = useMemo(() => (
    DAYS.reduce((acc, day) => {
      acc[day] = visibleRoutines.filter((routine) => routine.dayOfWeek === day)
      return acc
    }, {})
  ), [visibleRoutines])

  const subjectColorMap = useMemo(() => {
    const colorMap = {}
    visibleRoutines.forEach((routine) => {
      if (!colorMap[routine.subjectId]) {
        colorMap[routine.subjectId] = ROUTINE_TONES[Object.keys(colorMap).length % ROUTINE_TONES.length]
      }
    })
    return colorMap
  }, [visibleRoutines])

  return (
    <Layout>
      <div className={pageClassName}>
        <PageHeader
          title="Routine View"
          subtitle="Select a class scope first, then view only that department, semester, and section routine."
          breadcrumbs={[isCoordinator ? 'Coordinator' : 'Admin', 'Routine View']}
        />

        <Alert type="error" message={error} />

        {loading ? (
          <LoadingSkeleton rows={4} itemClassName="h-32" />
        ) : (
          <>
            <section className="mb-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-card-border)] bg-[var(--color-card-surface)] shadow-sm dark:shadow-slate-900/40">
              <div className="border-b border-[var(--color-card-border)] p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--color-text-soft)]">Class Scope</p>
                    <h2 className="mt-1 text-lg font-black text-[var(--color-heading)]">Choose department, semester, and section</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">The routine stays hidden until all three values are selected.</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                    readyToView
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200'
                      : 'border-[var(--color-card-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                  }`}>
                    {readyToView ? <CheckCircle2 className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                    <span>{readyToView ? 'Routine visible' : 'Selection required'}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="ui-form-label">Department</label>
                    <select
                      value={selection.department}
                      onChange={(event) => setSelection({ department: event.target.value, semester: '', section: '' })}
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
                      value={selection.semester}
                      onChange={(event) => setSelection((current) => ({ ...current, semester: event.target.value, section: '' }))}
                      className="ui-form-input"
                      disabled={!selection.department}
                    >
                      <option value="">Select semester</option>
                      {SEMESTER_OPTIONS.map((semester) => (
                        <option key={semester} value={semester}>Semester {semester}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ui-form-label">Section</label>
                    <select
                      value={selection.section}
                      onChange={(event) => setSelection((current) => ({ ...current, section: event.target.value }))}
                      className="ui-form-input"
                      disabled={!selection.department || !selection.semester || sectionOptions.length === 0}
                    >
                      <option value="">Select section</option>
                      {sectionOptions.map((section) => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                    {selection.department && selection.semester && sectionOptions.length === 0 ? (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">No sections are configured or scheduled for this class scope.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-3 md:p-5">
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><Layers className="h-4 w-4" /> Department</div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{selection.department || 'Not selected'}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><CalendarDays className="h-4 w-4" /> Semester</div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{selection.semester ? `Semester ${selection.semester}` : 'Not selected'}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-surface-muted)] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]"><Users className="h-4 w-4" /> Section</div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{selection.section || 'Not selected'}</p>
                </div>
              </div>
            </section>

            {!readyToView ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--color-card-border)] bg-[var(--color-card-surface)] px-5 py-10 text-center">
                <p className="text-sm font-semibold text-[var(--color-heading)]">Select department, semester, and section to view the routine.</p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">This prevents mixing multiple classes in one timetable.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--color-text-soft)]">Selected Class</p>
                    <h2 className="text-xl font-black text-[var(--color-heading)]">{selection.department} · Semester {selection.semester} · Section {selection.section}</h2>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">{visibleRoutines.length} scheduled {visibleRoutines.length === 1 ? 'entry' : 'entries'}</p>
                </div>

                <div className="mb-8 overflow-x-auto rounded-2xl">
                  <div className="grid min-w-[1040px] grid-cols-7 gap-3">
                    {DAYS.map((day) => (
                      <div key={day} className="min-h-[220px]">
                        <div className="ui-role-fill rounded-t-xl py-2 text-center text-sm font-semibold">
                          {DAY_SHORT[day]}
                        </div>
                        <div className="space-y-2 border-x border-b border-[var(--color-card-border)] bg-[var(--color-card-surface)] p-2">
                          {routinesByDay[day].map((routine) => (
                            <div key={routine.id} className={`rounded-xl border p-3 ${subjectColorMap[routine.subjectId]}`}>
                              <p className="truncate text-sm font-black">{routine.subject?.code}</p>
                              <p className="mt-1 truncate text-xs font-semibold">{routine.subject?.name}</p>
                              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">{formatClassType(routine.classType)}</p>
                              <p className="mt-2 text-xs">{routine.startTime}-{routine.endTime}</p>
                              <p className="mt-1 text-xs opacity-80">{routine.instructor?.user?.name || 'Instructor not assigned'}</p>
                              {routine.room ? <p className="mt-1 text-xs opacity-80">Room {routine.room}</p> : null}
                              {routine.note ? <p className="mt-2 text-[11px] font-semibold opacity-80">{routine.note}</p> : null}
                              {!routine.section ? <p className="mt-2 text-[11px] font-semibold opacity-70">All sections</p> : null}
                            </div>
                          ))}
                          {routinesByDay[day].length === 0 ? (
                            <div className="py-8 text-center text-xs text-[var(--color-text-soft)]">No class</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-card-border)] bg-[var(--color-card-surface)]">
                  <div className="border-b border-[var(--color-card-border)] p-4">
                    <h2 className="font-semibold text-[var(--color-heading)]">Routine Entries</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead className="bg-[var(--color-surface-muted)]">
                        <tr className="text-left text-sm text-[var(--color-text-muted)]">
                          <th className="px-6 py-3">Day</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3">Subject</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Instructor</th>
                          <th className="px-6 py-3">Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRoutines.map((routine) => (
                          <tr key={routine.id} className="border-t border-[var(--color-card-border)]">
                            <td className="px-6 py-3 text-sm font-semibold text-[var(--color-heading)]">{DAY_SHORT[routine.dayOfWeek]}</td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">{routine.startTime} - {routine.endTime}</td>
                            <td className="px-6 py-3">
                              <p className="text-sm font-semibold text-[var(--color-heading)]">{routine.subject?.name}</p>
                              <p className="text-xs text-[var(--color-text-soft)]">{routine.subject?.code}</p>
                            </td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">
                              <p className="font-semibold text-[var(--color-heading)]">{formatClassType(routine.classType)}</p>
                              {routine.note ? <p className="mt-1 max-w-[220px] text-xs text-[var(--color-text-soft)]">{routine.note}</p> : null}
                            </td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">{routine.instructor?.user?.name || '-'}</td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">{routine.room || '-'}</td>
                          </tr>
                        ))}
                        {visibleRoutines.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-[var(--color-text-soft)]">No routine has been created for this class yet.</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default RoutineViewer
