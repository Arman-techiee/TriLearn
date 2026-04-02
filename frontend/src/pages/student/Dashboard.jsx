import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenText, CheckCircle2, ClipboardList } from 'lucide-react'
import StudentLayout from '../../layouts/StudentLayout'
import EmptyState from '../../components/EmptyState'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import logger from '../../utils/logger'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalAssignments: 0,
    attendancePercentage: '0%',
  })
  const [notices, setNotices] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subjectsRes, assignmentsRes, noticesRes, attendanceRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/assignments'),
        api.get('/notices'),
        api.get('/attendance/my'),
      ])

      const attendanceSummary = attendanceRes.data.summary
      const avgAttendance = attendanceSummary.length > 0
        ? (attendanceSummary.reduce((sum, s) =>
            sum + parseFloat(s.percentage), 0) / attendanceSummary.length).toFixed(1) + '%'
        : '0%'

      setStats({
        totalSubjects: subjectsRes.data.total,
        totalAssignments: assignmentsRes.data.total,
        attendancePercentage: avgAttendance,
      })

      setNotices(noticesRes.data.notices.slice(0, 3))
      setAttendance(attendanceSummary)

    } catch (error) {
      logger.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <StudentLayout>
      <div className="p-4 md:p-8">
        <LoadingSkeleton rows={5} itemClassName="h-24" />
      </div>
    </StudentLayout>
  )

  return (
    <StudentLayout>
      <div className="p-4 md:p-8">

        <PageHeader
          title={`Welcome back, ${user?.name}!`}
          subtitle="Here's your academic overview"
          breadcrumbs={['Student', 'Dashboard']}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <StatCard title="My Subjects" value={stats.totalSubjects} icon={BookOpenText} iconClassName="from-purple-500 to-fuchsia-600" trend="+2.7%" trendLabel="current semester" />
          <StatCard title="Assignments" value={stats.totalAssignments} icon={ClipboardList} iconClassName="from-blue-500 to-indigo-600" trend="+4.2%" trendLabel="due this week" />
          <StatCard title="Avg Attendance" value={stats.attendancePercentage} icon={CheckCircle2} iconClassName="from-emerald-500 to-green-600" trend="+1.5%" trendLabel="class consistency" />
        </div>

        <Link
          to="/student/scan"
          className="mb-8 block bg-linear-to-r from-purple-600 to-fuchsia-600 text-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Scan Gate QR</h2>
              <p className="text-sm text-purple-100 mt-1">
                Open your phone camera from here to scan the college gate QR and mark today&apos;s attendance quickly.
              </p>
            </div>
            <div className="text-5xl">📷</div>
          </div>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Attendance Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Summary</h2>
            <div className="space-y-3">
              {attendance.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.subject}</p>
                    <p className="text-xs text-gray-500">{item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      parseFloat(item.percentage) >= 75 ? 'text-green-600' :
                      parseFloat(item.percentage) >= 50 ? 'text-orange-500' :
                      'text-red-600'}`}>
                      {item.percentage}
                    </p>
                    <p className="text-xs text-gray-400">{item.present}/{item.total} classes</p>
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <EmptyState
                  icon="📈"
                  title="No attendance records yet"
                  description="Your attendance summary will appear here once classes start recording entries."
                />
              )}
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Notices</h2>
            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${notice.type === 'EXAM' ? 'bg-red-100 text-red-700' :
                        notice.type === 'URGENT' ? 'bg-orange-100 text-orange-700' :
                        notice.type === 'EVENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {notice.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{notice.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{notice.content}</p>
                </div>
              ))}
              {notices.length === 0 && (
                <EmptyState
                  icon="📣"
                  title="No notices yet"
                  description="Recent notices from your campus will appear here once they are posted."
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentDashboard



