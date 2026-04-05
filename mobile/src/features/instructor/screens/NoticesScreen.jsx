import NoticeCard from '../../../components/notices/NoticeCard'
import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'

const InstructorNoticesScreen = () => (
  <SimpleCollectionScreen
    endpoint="/notices"
    title="Notices"
    subtitle="Department and campus-wide communications."
    responseKey="notices"
    renderItem={({ item }) => <NoticeCard item={item} />}
  />
)

export default InstructorNoticesScreen
