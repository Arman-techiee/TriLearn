import AssignmentCard from '../../../components/assignments/AssignmentCard'
import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'

const StudentAssignmentsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/assignments"
    title="Assignments"
    subtitle="Upcoming work and submission deadlines."
    responseKey="assignments"
    renderItem={({ item }) => <AssignmentCard item={item} />}
  />
)

export default StudentAssignmentsScreen
