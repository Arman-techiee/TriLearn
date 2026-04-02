import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, QrCode, RefreshCw } from 'lucide-react'
import GateLayout from '../../layouts/GateLayout'
import PageHeader from '../../components/PageHeader'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import QrScanPanel from '../../components/QrScanPanel'
import api from '../../utils/api'
import logger from '../../utils/logger'
import { getFriendlyErrorMessage } from '../../utils/errors'
import { useToast } from '../../components/Toast'

const formatTime = (value) => (
  value
    ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--'
)

const GateDashboard = () => {
  const [liveQrState, setLiveQrState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [scanBusy, setScanBusy] = useState(false)
  const { showToast } = useToast()

  const fetchLiveQr = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')
      const res = await api.get('/attendance/gatekeeper/live-qr')
      setLiveQrState(res.data)
    } catch (requestError) {
      logger.error(requestError)
      setError(getFriendlyErrorMessage(requestError, 'Unable to load the Student QR right now.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchLiveQr()

    const intervalId = window.setInterval(() => {
      void fetchLiveQr({ silent: true })
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [fetchLiveQr])

  const statusText = useMemo(() => {
    if (liveQrState?.holiday) {
      return liveQrState.holidayInfo?.title || 'Holiday'
    }

    if (liveQrState?.active) {
      return `Semester ${liveQrState.allowedSemesters?.join(', ')}`
    }

    if (liveQrState?.timePassed) {
      return 'Time passed'
    }

    if (liveQrState?.nextWindow) {
      return `Next at ${formatTime(liveQrState.nextWindow.startsAt)}`
    }

    return 'No slot today'
  }, [liveQrState])

  const submitStudentIdQr = async (qrData) => {
    try {
      setScanBusy(true)
      setError('')
      const res = await api.post('/attendance/scan-student-id', { qrData })
      const subjectList = (res.data.markedSubjects || []).map((subject) => subject.code).join(', ')
      showToast({
        title: `Attendance marked for ${res.data.student?.name || 'student'}.`,
        description: subjectList ? `Recorded for ${subjectList}` : res.data.message
      })
      await fetchLiveQr({ silent: true })
    } catch (requestError) {
      logger.error(requestError)
      setError(getFriendlyErrorMessage(requestError, 'Unable to mark attendance from the student ID card right now.'))
    } finally {
      setScanBusy(false)
    }
  }

  return (
    <GateLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Student QR"
          subtitle="Show this QR to students. It rotates every minute and only works for the semesters allowed in the current time slot."
          breadcrumbs={['Gatekeeper', 'Student QR']}
          actions={[
            {
              label: refreshing ? 'Refreshing...' : 'Refresh',
              icon: RefreshCw,
              variant: 'secondary',
              onClick: () => fetchLiveQr({ silent: true }),
              disabled: refreshing
            }
          ]}
        />

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {loading && !liveQrState ? (
          <LoadingSkeleton rows={3} itemClassName="h-48" />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="ui-card rounded-3xl p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    <Clock3 className="h-4 w-4" />
                    <span>{statusText}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-900">
                    {liveQrState?.holiday
                      ? 'Holiday mode is active'
                      : liveQrState?.active
                        ? 'Student QR is live now'
                        : liveQrState?.timePassed
                          ? 'Scan time has passed'
                          : 'Waiting for the next Student QR slot'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    {liveQrState?.holiday
                      ? 'Attendance deduction is skipped today because the college is marked as a holiday.'
                      : liveQrState?.active
                        ? `Only the selected semesters may scan this code until ${formatTime(liveQrState.expiresAt)}.`
                        : liveQrState?.timePassed
                          ? 'The last Student QR window for today has already closed.'
                          : liveQrState?.nextWindow
                            ? `The next Student QR window opens at ${formatTime(liveQrState.nextWindow.startsAt)}.`
                            : 'No Student QR slot is configured for the rest of today.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Day</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{liveQrState?.dayOfWeek || '--'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Refresh</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {liveQrState?.active ? `${liveQrState.refreshInSeconds || 0}s` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {liveQrState?.active ? (
                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
                  <div className="space-y-4">
                    {liveQrState.periods?.map((period) => (
                      <div key={period.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="font-semibold text-slate-900">{period.title || 'Student QR Slot'}</p>
                        <p className="mt-1 text-sm text-slate-500">{period.startTime} to {period.endTime}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {period.allowedSemesters?.map((semester) => (
                            <span key={semester} className="ui-status-badge ui-status-warning">Semester {semester}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span>Live QR</span>
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <img src={liveQrState.qrCode} alt="Student attendance QR" className="w-full rounded-2xl" />
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-500">
                      Expires at <span className="font-semibold text-slate-800">{formatTime(liveQrState.expiresAt)}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--color-role-gate)] shadow-sm">
                    <CalendarDays className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {liveQrState?.holiday ? 'Today is a holiday' : liveQrState?.timePassed ? 'Time passed' : 'No active Student QR'}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                    {liveQrState?.holiday
                      ? liveQrState.holidayInfo?.description || 'Attendance is paused for today.'
                      : liveQrState?.nextWindow
                        ? `Next slot: ${liveQrState.nextWindow.startTime} to ${liveQrState.nextWindow.endTime} for semester ${liveQrState.nextWindow.allowedSemesters?.join(', ')}.`
                        : 'Ask an admin or coordinator to create a Student QR time slot if one should be available.'}
                  </p>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <QrScanPanel
                title="Scan Student ID Card"
                description="Gatekeeper can scan the student’s ID card QR to mark attendance for the active Student QR time slot."
                submitLabel="Mark Attendance"
                onSubmit={submitStudentIdQr}
                busy={scanBusy}
                accentClassName="focus:ring-amber-500"
              />

              <section className="ui-card rounded-3xl p-6">
                <h2 className="text-lg font-semibold text-slate-900">Rules</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p className="rounded-2xl bg-slate-50 px-4 py-3">Any student may scan only if their semester is allowed in the current time slot.</p>
                  <p className="rounded-2xl bg-slate-50 px-4 py-3">The code rotates every 60 seconds to reduce screenshot sharing.</p>
                  <p className="rounded-2xl bg-slate-50 px-4 py-3">If the day is a holiday, no QR scan is accepted and attendance is not deducted.</p>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </GateLayout>
  )
}

export default GateDashboard
