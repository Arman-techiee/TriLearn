// StudentRoutine.jsx — use the same component for Instructor with InstructorLayout

import { useState, useEffect, useCallback } from 'react'
import StudentLayout from '../../layouts/StudentLayout'
import PageHeader from '../../components/PageHeader'
import api from '../../utils/api'
import logger from '../../utils/logger'
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_SHORT = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun' }

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
]

const todayName = () => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  return days[new Date().getDay()]
}

const timeRange = (start, end) => `${start} - ${end}`

const StudentRoutine = () => {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(todayName())

  const fetchRoutines = useCallback(async () => {
    try {
      const res = await api.get('/routines')
      setRoutines(res.data.routines)
    } catch (err) {
      logger.error('Failed to load student routine', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRoutines()
  }, [fetchRoutines])

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = routines.filter(r => r.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {})

  const subjectColorMap = {}
  routines.forEach((r) => {
    if (!subjectColorMap[r.subjectId]) {
      subjectColorMap[r.subjectId] = COLORS[Object.keys(subjectColorMap).length % COLORS.length]
    }
  })

  const todayClasses = byDay[activeDay] || []

  return (
    <StudentLayout>
      <div className="p-8">

        <PageHeader
          title="Class Routine"
          subtitle="Your weekly timetable"
          breadcrumbs={['Student', 'Routine']}
        />

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                    activeDay === day ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {DAY_SHORT[day]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
              {DAYS.map(day => (
                <div
                  key={day}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    day === todayName() ? 'border-purple-200 bg-purple-50' : 'border-slate-200 bg-white'
                  } ${activeDay === day ? 'ring-2 ring-purple-200' : ''}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold ${day === todayName() ? 'text-purple-700' : 'text-slate-700'}`}>{DAY_SHORT[day]}</p>
                      <p className="text-xs text-slate-400">{byDay[day].length} classes</p>
                    </div>
                    {day === todayName() ? <span className="ui-status-badge">Today</span> : null}
                  </div>

                  <div className="space-y-3">
                    {byDay[day].length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                        No classes
                      </div>
                    ) : (
                      byDay[day].map((r) => (
                        <div key={r.id} className={`rounded-2xl border p-4 ${subjectColorMap[r.subjectId]}`}>
                          <span className="mb-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                            {timeRange(r.startTime, r.endTime)}
                          </span>
                          <h3 className="font-semibold text-gray-800">{r.subject?.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">{r.subject?.code}</p>
                          <p className="mt-2 text-xs text-gray-500">Instructor: {r.instructor?.user?.name}</p>
                          {r.room ? <p className="mt-1 text-xs text-gray-500">Room: {r.room}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  )
}

export default StudentRoutine


