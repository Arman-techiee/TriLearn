import { Bell, BookOpen, CalendarDays, ClipboardCheck, FileStack, GraduationCap, House, MessageSquare } from 'lucide-react-native'
import createTabsLayout from '../../../navigation/createTabsLayout'

const InstructorTabsLayout = createTabsLayout([
  { name: 'index', title: 'Home', icon: House },
  { name: 'attendance', title: 'Attendance', icon: ClipboardCheck },
  { name: 'marks', title: 'Marks', icon: GraduationCap },
  { name: 'assignments', title: 'Tasks', icon: FileStack },
  { name: 'notices', title: 'Notices', icon: Bell },
  { name: 'materials', title: 'Materials', icon: BookOpen, href: null },
  { name: 'routine', title: 'Routine', icon: CalendarDays, href: null },
  { name: 'subjects', title: 'Subjects', icon: BookOpen, href: null },
  { name: 'requests', title: 'Requests', icon: MessageSquare, href: null }
])

export default InstructorTabsLayout
