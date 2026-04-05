import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const StudentRoutineScreen = () => (
  <SimpleCollectionScreen
    endpoint="/routines"
    title="Routine"
    subtitle="Your current class schedule."
    responseKey="routines"
    renderItem={({ item }) => <InfoCard title={item.subject?.name || item.title || 'Routine item'} subtitle={item.startTime || item.dayOfWeek || 'Schedule details'} />}
  />
)

export default StudentRoutineScreen
