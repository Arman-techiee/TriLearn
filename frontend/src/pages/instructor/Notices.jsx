import { useState, useEffect } from 'react'
import InstructorLayout from '../../layouts/InstructorLayout'
import api from '../../utils/api'

const typeColors = {
  GENERAL: 'bg-gray-100 text-gray-700',
  EXAM: 'bg-red-100 text-red-700',
  HOLIDAY: 'bg-green-100 text-green-700',
  EVENT: 'bg-blue-100 text-blue-700',
  URGENT: 'bg-orange-100 text-orange-700',
}

const InstructorNotices = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchNotices() }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notices')
      setNotices(res.data.notices)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/notices', form)
      setSuccess('Notice posted successfully!')
      setShowModal(false)
      setForm({ title: '', content: '', type: 'GENERAL' })
      fetchNotices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <InstructorLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notices</h1>
            <p className="text-gray-500 text-sm mt-1">View and post notices</p>
          </div>
          <button onClick={() => { setShowModal(true); setError('') }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
            + Post Notice
          </button>
        </div>

        {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[notice.type]}`}>
                    {notice.type}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(notice.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs text-gray-400">by {notice.user?.name}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{notice.title}</h3>
                <p className="text-sm text-gray-500">{notice.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Post Notice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <textarea placeholder="Content" required rows={4} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="GENERAL">General</option>
                <option value="EXAM">Exam</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="EVENT">Event</option>
                <option value="URGENT">Urgent</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </InstructorLayout>
  )
}

export default InstructorNotices