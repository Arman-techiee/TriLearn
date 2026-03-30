import { useState, useEffect } from 'react'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
)

const InstructorDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalAssignments: 0,
    totalNotices: 0,
  })
  const [subjects, setSubjects] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subjectsRes, assignmentsRes, noticesRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/assignments'),
        api.get('/notices'),
      ])

      setSubjects(subjectsRes.data.subjects.slice(0, 3))
      setNotices(noticesRes.data.notices.slice(0, 3))
      setStats({
        totalSubjects: subjectsRes.data.total,
        totalAssignments: assignmentsRes.data.total,
        totalNotices: noticesRes.data.total,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <InstructorLayout>
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    </InstructorLayout>
  )

  return (
    <InstructorLayout>
      <div className="p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's what's happening in your classes today
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="My Subjects" value={stats.totalSubjects} icon="📚" color="border-green-500" />
          <StatCard title="Assignments" value={stats.totalAssignments} icon="📝" color="border-blue-500" />
          <StatCard title="Notices" value={stats.totalNotices} icon="📢" color="border-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* My Subjects */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">My Subjects</h2>
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{subject.name}</p>
                    <p className="text-xs text-gray-500">{subject.code} · Sem {subject.semester}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{subject._count?.assignments} assignments</p>
                    <p>{subject._count?.attendances} attendance</p>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No subjects assigned yet</p>
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
                <p className="text-gray-400 text-sm text-center py-4">No notices yet</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </InstructorLayout>
  )
}

export default InstructorDashboard