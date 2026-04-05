import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const AdminDepartmentsScreen = () => (
  <SimpleCollectionScreen
    endpoint="/departments"
    title="Departments"
    subtitle="Department list and ownership structure."
    responseKey="departments"
    renderItem={({ item }) => <InfoCard title={item.name || 'Department'} subtitle={item.code || 'No code available'} />}
  />
)

export default AdminDepartmentsScreen
