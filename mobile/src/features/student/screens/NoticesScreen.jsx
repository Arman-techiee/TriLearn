import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import NoticeCard from '../../../components/notices/NoticeCard'

const StudentNoticesScreen = () => (
  <SimpleCollectionScreen
    endpoint="/notices"
    title="Notices"
    subtitle="Latest announcements from your college."
    responseKey="notices"
    renderItem={({ item }) => <NoticeCard item={item} />}
    emptyTitle="No notices available"
    emptyDescription="Published notices from staff will appear here."
  />
)

export default StudentNoticesScreen
