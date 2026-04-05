import NoticeCard from '../../../components/notices/NoticeCard'
import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'

const AdminNoticesScreen = () => (
  <SimpleCollectionScreen
    endpoint="/notices"
    title="Notices"
    subtitle="Review the current notice feed."
    responseKey="notices"
    renderItem={({ item }) => <NoticeCard item={item} />}
  />
)

export default AdminNoticesScreen
