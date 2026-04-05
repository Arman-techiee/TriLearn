import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const StudentMaterialsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/materials"
    title="Study Materials"
    subtitle="Shared PDFs and learning resources."
    responseKey="materials"
    renderItem={({ item }) => <InfoCard title={item.title || item.name || 'Study material'} subtitle={item.subject?.name || item.description || 'Course resource'} />}
  />
)

export default StudentMaterialsScreen
