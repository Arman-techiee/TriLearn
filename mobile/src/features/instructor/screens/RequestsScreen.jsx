import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const InstructorRequestsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/attendance/tickets"
    title="Requests"
    subtitle="Student absence tickets awaiting review."
    responseKey="tickets"
    renderItem={({ item }) => <InfoCard title={item.reason || 'Ticket request'} subtitle={item.status || 'PENDING'} />}
  />
)

export default InstructorRequestsScreen
