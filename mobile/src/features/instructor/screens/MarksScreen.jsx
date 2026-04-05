import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const InstructorMarksScreen = () => (
  <SimpleCollectionScreen
    endpoint="/subjects"
    title="Marks"
    subtitle="Open your subject list and move into marks workflows."
    responseKey="subjects"
    renderItem={({ item }) => <InfoCard title={item.name || 'Subject'} subtitle={item.code || 'No code available'} />}
  />
)

export default InstructorMarksScreen
