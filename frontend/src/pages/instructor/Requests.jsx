import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, MessageSquareText, XCircle } from 'lucide-react'
import InstructorLayout from '../../layouts/InstructorLayout'
import CoordinatorLayout from '../../layouts/CoordinatorLayout'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Alert from '../../components/Alert'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { getFriendlyErrorMessage } from '../../utils/errors'
import { isRequestCanceled } from '../../utils/http'

const statusToneMap = {
  APPROVED: 'ui-status-success',
  REJECTED: 'ui-status-danger',
  PENDING: 'ui-status-warning'
}

const statusOptions = ['PENDING', 'APPROVED', 'REJECTED']

const InstructorRequests = () => {
  const { user } = useAuth()
  const isCoordinator = user?.role === 'COORDINATOR'
  const Layout = isCoordinator ? CoordinatorLayout : InstructorLayout
  const { showToast } = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [drafts, setDrafts] = useState({})

  const roleLabel = user?.role === 'COORDINATOR' ? 'department' : 'class'

  const loadTickets = async (signal) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/attendance/tickets', { signal })
      const nextTickets = response.data.tickets || []
      setTickets(nextTickets)
      setDrafts((current) => {
        const nextDrafts = { ...current }
        nextTickets.forEach((ticket) => {
          if (!(ticket.id in nextDrafts)) {
            nextDrafts[ticket.id] = ticket.response || ''
          }
        })
        return nextDrafts
      })
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return
      setError(getFriendlyErrorMessage(requestError, 'Unable to load requests right now.'))
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadTickets(controller.signal)
    return () => controller.abort()
  }, [])

  const filteredTickets = useMemo(() => (
    tickets.filter((ticket) => ticket.status === statusFilter)
  ), [statusFilter, tickets])

  const counts = useMemo(() => (
    tickets.reduce((summary, ticket) => {
      summary[ticket.status] = (summary[ticket.status] || 0) + 1
      return summary
    }, { PENDING: 0, APPROVED: 0, REJECTED: 0 })
  ), [tickets])

  const reviewTicket = async (ticketId, status) => {
    try {
      setSavingId(ticketId)
      setError('')
      await api.patch(`/attendance/tickets/${ticketId}`, {
        status,
        response: String(drafts[ticketId] || '').trim()
      })
      showToast({
        title: `Request ${status.toLowerCase()} successfully.`,
        description: 'The student can now see the latest review response in their Requests section.'
      })
      await loadTickets()
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to update the request right now.'))
    } finally {
      setSavingId('')
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Requests"
          subtitle={`Review absence requests for your ${roleLabel} and reply to students from one place.`}
          breadcrumbs={[user?.role === 'COORDINATOR' ? 'Coordinator' : 'Instructor', 'Requests']}
        />

        <Alert type="error" message={error} />

        {loading ? (
          <LoadingSkeleton rows={5} itemClassName="h-36" />
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    statusFilter === status
                      ? 'border-[var(--color-role-accent)] bg-[var(--color-role-accent)] text-white'
                      : 'border-slate-200 bg-[--color-bg-card] dark:bg-slate-800 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{status}</p>
                  <p className="mt-2 text-2xl font-bold">{counts[status] || 0}</p>
                </button>
              ))}
            </section>

            <section className="ui-card rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Absence Requests</h2>
                  <p className="text-sm text-slate-500">Students will see your review note inside their Requests page.</p>
                </div>
                <span className="ui-status-badge ui-status-neutral">{filteredTickets.length} records</span>
              </div>

              {filteredTickets.length === 0 ? (
                <EmptyState
                  icon="📬"
                  title="No requests found"
                  description="There are no student absence requests in this view right now."
                />
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    (() => {
                      const isApproved = ticket.status === 'APPROVED'

                      if (isApproved) {
                        return (
                          <div key={ticket.id} className="rounded-2xl border border-primary-200 bg-primary-50/70 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="text-lg font-semibold text-slate-900">{ticket.student?.user?.name || 'Student'}</p>
                                  <span className="ui-status-badge ui-status-success">APPROVED</span>
                                </div>
                                <p className="text-sm text-slate-500">{ticket.student?.user?.email}</p>
                                <p className="text-sm text-slate-600">
                                  {ticket.attendance?.subject?.name} ({ticket.attendance?.subject?.code}) on {new Date(ticket.attendance?.date).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                <div className="rounded-xl bg-[--color-bg-card] dark:bg-slate-800 px-4 py-3">
                                  <p className="font-medium text-slate-700">Reviewed</p>
                                  <p>{ticket.reviewedAt ? new Date(ticket.reviewedAt).toLocaleString() : 'Not yet'}</p>
                                </div>
                                <div className="rounded-xl bg-[--color-bg-card] dark:bg-slate-800 px-4 py-3">
                                  <p className="font-medium text-slate-700">Final response</p>
                                  <p>{ticket.response || 'No response added'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-[--color-bg-card] dark:bg-slate-800 p-5">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-lg font-semibold text-slate-900">{ticket.student?.user?.name || 'Student'}</p>
                                <span className={`ui-status-badge ${statusToneMap[ticket.status] || 'ui-status-neutral'}`}>{ticket.status}</span>
                              </div>
                              <p className="text-sm text-slate-500">{ticket.student?.user?.email}</p>
                              <p className="text-sm text-slate-600">
                                {ticket.attendance?.subject?.name} ({ticket.attendance?.subject?.code}) on {new Date(ticket.attendance?.date).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="font-medium text-slate-700">Submitted</p>
                                <p>{new Date(ticket.createdAt).toLocaleString()}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="font-medium text-slate-700">Reviewed</p>
                                <p>{ticket.reviewedAt ? new Date(ticket.reviewedAt).toLocaleString() : 'Not yet'}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="font-medium text-slate-700">Request Id</p>
                                <p className="truncate">{ticket.id}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                <MessageSquareText className="h-4 w-4" />
                                <span>Student explanation</span>
                              </div>
                              <p className="text-sm leading-6 text-slate-600">{ticket.reason}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 px-4 py-4">
                              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                <Clock3 className="h-4 w-4" />
                                <span>Your response</span>
                              </div>
                              <textarea
                                rows={4}
                                value={drafts[ticket.id] || ''}
                                onChange={(event) => setDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))}
                                placeholder="Add a response the student will see in Requests..."
                                className="ui-form-input"
                              />
                              <div className="mt-3 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => reviewTicket(ticket.id, 'APPROVED')}
                                  disabled={savingId === ticket.id}
                                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>{savingId === ticket.id ? 'Saving...' : 'Approve'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => reviewTicket(ticket.id, 'REJECTED')}
                                  disabled={savingId === ticket.id}
                                  className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>{savingId === ticket.id ? 'Saving...' : 'Reject'}</span>
                                </button>
                              </div>
                              {ticket.response ? (
                                <p className="mt-3 text-sm text-slate-500">
                                  Current shared response: <span className="font-medium text-slate-700">{ticket.response}</span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default InstructorRequests
