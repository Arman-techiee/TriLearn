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
  ShieldUser,
  UserCircle2,
  Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isCoordinator = user?.role === 'COORDINATOR'
  const basePath = isCoordinator ? '/coordinator' : '/admin'
  const roleLabel = isCoordinator ? 'Coordinator Panel' : 'Admin Panel'

  const sidebarItems = useMemo(() => (
    isCoordinator
      ? [
          { path: `${basePath}`, label: 'Dashboard', icon: LayoutDashboard, meta: 'Overview' },
          { path: `${basePath}/users`, label: 'Students', icon: Users, meta: 'People and access' },
          { path: `${basePath}/applications`, label: 'Admissions', icon: FileText, meta: 'Applications' },
          { path: `${basePath}/subjects`, label: 'Subjects', icon: BookOpenText, meta: 'Academic setup' },
          { path: `${basePath}/attendance`, label: 'Attendance', icon: Percent, meta: 'Attendance records' },
          { path: `${basePath}/assignments`, label: 'Assignments', icon: ClipboardList, meta: 'Task tracking' },
          { path: `${basePath}/marks`, label: 'Results', icon: FileText, meta: 'Assessment data' },
          { path: `${basePath}/materials`, label: 'Books', icon: FolderOpen, meta: 'Learning materials' },
          { path: `${basePath}/profile`, label: 'Profile', icon: UserCircle2, meta: 'My account' }
        ]
      : [
          { path: `${basePath}`, label: 'Dashboard', icon: LayoutDashboard, meta: 'Overview' },
          { path: `${basePath}/users`, label: 'Users', icon: Users, meta: 'People and roles' },
          { path: `${basePath}/applications`, label: 'Admissions', icon: FileText, meta: 'Application review' },
          { path: `${basePath}/departments`, label: 'Departments', icon: ShieldUser, meta: 'Department setup' },
          { path: `${basePath}/subjects`, label: 'Subjects', icon: BookOpenText, meta: 'Academic setup' },
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
      roleTheme="admin"
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

export default AdminLayout
