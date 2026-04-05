import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const InstructorSubjectsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/subjects"
    title="Subjects"
    subtitle="Subjects currently assigned to you."
    responseKey="subjects"
    renderItem={({ item }) => <InfoCard title={item.name || 'Subject'} subtitle={item.code || 'No code available'} />}
  />
)

export default InstructorSubjectsScreen
