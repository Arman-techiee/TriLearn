import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Percent,
  UserCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'

const InstructorLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isCoordinator = user?.role === 'COORDINATOR'
  const basePath = isCoordinator ? '/coordinator' : '/instructor'
  const roleLabel = isCoordinator ? 'Coordinator Panel' : 'Instructor Panel'

  const sidebarItems = useMemo(() => (
    isCoordinator
      ? [
          { path: `${basePath}`, label: 'Dashboard', icon: LayoutDashboard, meta: 'Overview' },
          { path: `${basePath}/attendance`, label: 'Attendance', icon: Percent, meta: 'Department attendance' },
          { path: `${basePath}/assignments`, label: 'Assignments', icon: ClipboardList, meta: 'Assignment tracking' },
          { path: `${basePath}/marks`, label: 'Results', icon: FileText, meta: 'Assessment results' },
          { path: `${basePath}/materials`, label: 'Books', icon: FolderOpen, meta: 'Learning materials' },
          { path: `${basePath}/applications`, label: 'Admissions', icon: FileText, meta: 'Application review' },
          { path: `${basePath}/profile`, label: 'Profile', icon: UserCircle2, meta: 'My account' }
        ]
      : [
          { path: `${basePath}`, label: 'Dashboard', icon: LayoutDashboard, meta: 'Overview' },
          { path: `${basePath}/subjects`, label: 'Learnings', icon: BookOpenText, meta: 'Assigned subjects' },
          { path: `${basePath}/assignments`, label: 'Tasks', icon: ClipboardList, meta: 'Class assignments' },
          { path: `${basePath}/attendance`, label: 'Attendance', icon: Percent, meta: 'Attendance records' },
          { path: `${basePath}/marks`, label: 'Results', icon: FileText, meta: 'Assessment results' },
          { path: `${basePath}/materials`, label: 'Books', icon: FolderOpen, meta: 'Learning materials' },
          { path: `${basePath}/profile`, label: 'Profile', icon: UserCircle2, meta: 'My account' }
        ]
  ), [basePath, isCoordinator])

  const topItems = [
    { path: `${basePath}/routine`, label: 'Routine', icon: CalendarDays },
    { path: `${basePath}/notices`, label: 'Notices', icon: Bell },
    { label: 'Events', icon: CalendarDays },
    { label: 'Requests', icon: ClipboardList },
    { label: 'Key Dates', icon: CalendarDays },
    { label: 'Survey', icon: FileText },
    { label: 'Weekly', icon: Bell }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppShell
      roleLabel={roleLabel}
      roleTheme="instructor"
      user={user}
      sidebarItems={sidebarItems}
      topItems={topItems}
      activePath={location.pathname}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  )
}

export default InstructorLayout
