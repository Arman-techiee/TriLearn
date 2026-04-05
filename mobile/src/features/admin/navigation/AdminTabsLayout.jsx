import { Bell, Building2, CalendarDays, House, Layers3, Users } from 'lucide-react-native'
import createTabsLayout from '../../../navigation/createTabsLayout'

const AdminTabsLayout = createTabsLayout([
  { name: 'index', title: 'Home', icon: House },
  { name: 'users', title: 'Users', icon: Users },
  { name: 'departments', title: 'Departments', icon: Building2 },
  { name: 'subjects', title: 'Subjects', icon: Layers3 },
  { name: 'notices', title: 'Notices', icon: Bell },
  { name: 'routine', title: 'Routine', icon: CalendarDays, href: null }
])

export default AdminTabsLayout
