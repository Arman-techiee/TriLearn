import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const InstructorMaterialsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/materials"
    title="Materials"
    subtitle="Shared study material library."
    responseKey="materials"
    renderItem={({ item }) => <InfoCard title={item.title || item.name || 'Study material'} subtitle={item.subject?.name || item.description || 'Course resource'} />}
  />
)

export default InstructorMaterialsScreen
