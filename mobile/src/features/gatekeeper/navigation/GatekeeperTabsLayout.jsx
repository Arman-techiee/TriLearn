import { ScanFace } from 'lucide-react-native'
import createTabsLayout from '../../../navigation/createTabsLayout'

const GatekeeperTabsLayout = createTabsLayout([
  { name: 'index', title: 'Scanner', icon: ScanFace }
])

export default GatekeeperTabsLayout
