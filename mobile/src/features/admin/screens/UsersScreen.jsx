import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import InfoCard from '../../../components/common/InfoCard'

const AdminUsersScreen = () => (
  <SimpleCollectionScreen
    endpoint="/admin/users"
    title="Users"
    subtitle="Users across all roles."
    responseKey="users"
    renderItem={({ item }) => <InfoCard title={item.name || 'User'} subtitle={item.email || 'No email available'} extra={item.role || 'Unknown role'} />}
  />
)

export default AdminUsersScreen
