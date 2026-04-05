import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const StudentSubjectsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/subjects"
    title="Subjects"
    subtitle="Subjects assigned to your semester and department."
    responseKey="subjects"
    renderItem={({ item }) => <InfoCard title={item.name || 'Subject'} subtitle={item.code || 'No code available'} />}
  />
)

export default StudentSubjectsScreen
