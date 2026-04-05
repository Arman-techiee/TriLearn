import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const StudentTicketsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/attendance/tickets/my"
    title="Absence Tickets"
    subtitle="Track the status of your submitted attendance requests."
    responseKey="tickets"
    renderItem={({ item }) => <InfoCard title={item.reason || 'Absence request'} subtitle={item.status || 'PENDING'} />}
  />
)

export default StudentTicketsScreen
