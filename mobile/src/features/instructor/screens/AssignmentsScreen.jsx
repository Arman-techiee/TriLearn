import AssignmentCard from '../../../components/assignments/AssignmentCard'
import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'

const InstructorAssignmentsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/assignments"
    title="Assignments"
    subtitle="Review active assignment work across your teaching load."
    responseKey="assignments"
    renderItem={({ item }) => <AssignmentCard item={item} />}
  />
)

export default InstructorAssignmentsScreen
