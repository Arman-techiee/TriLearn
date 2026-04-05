import { Bell, ClipboardCheck, GraduationCap, House, BookOpen, CalendarDays, FileStack, Ticket, IdCard } from 'lucide-react-native'
import createTabsLayout from '../../../navigation/createTabsLayout'

const StudentTabsLayout = createTabsLayout([
  { name: 'index', title: 'Home', icon: House },
  { name: 'attendance', title: 'Attendance', icon: ClipboardCheck },
  { name: 'marks', title: 'Marks', icon: GraduationCap },
  { name: 'notices', title: 'Notices', icon: Bell },
  { name: 'routine', title: 'Routine', icon: CalendarDays, href: null },
  { name: 'assignments', title: 'Assignments', icon: FileStack, href: null },
  { name: 'materials', title: 'Materials', icon: BookOpen, href: null },
  { name: 'subjects', title: 'Subjects', icon: BookOpen, href: null },
  { name: 'tickets', title: 'Tickets', icon: Ticket, href: null },
  { name: 'id-card', title: 'ID Card', icon: IdCard, href: null }
])

export default StudentTabsLayout
