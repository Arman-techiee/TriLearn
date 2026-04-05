import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const AdminRoutineScreen = () => (
  <SimpleCollectionScreen
    endpoint="/routines"
    title="Routine"
    subtitle="Review scheduled routines across the institution."
    responseKey="routines"
    renderItem={({ item }) => <InfoCard title={item.subject?.name || item.title || 'Routine item'} subtitle={item.startTime || item.dayOfWeek || 'Schedule details'} />}
  />
)

export default AdminRoutineScreen
