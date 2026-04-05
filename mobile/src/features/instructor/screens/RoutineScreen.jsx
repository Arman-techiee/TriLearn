import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const InstructorRoutineScreen = () => (
  <SimpleCollectionScreen
    endpoint="/routines"
    title="Routine"
    subtitle="Daily class schedule and timing."
    responseKey="routines"
    renderItem={({ item }) => <InfoCard title={item.subject?.name || item.title || 'Routine item'} subtitle={item.startTime || item.dayOfWeek || 'Schedule details'} />}
  />
)

export default InstructorRoutineScreen
