import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const AdminSubjectsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/subjects"
    title="Subjects"
    subtitle="Current subject catalog."
    responseKey="subjects"
    renderItem={({ item }) => <InfoCard title={item.name || 'Subject'} subtitle={item.code || 'No code available'} />}
  />
)

export default AdminSubjectsScreen
