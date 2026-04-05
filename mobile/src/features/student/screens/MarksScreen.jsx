import { useEffect, useState } from 'react'
import AppCard from '../../../components/common/AppCard'
import MarksChart from '../../../components/marks/MarksChart'
import MarksCard from '../../../components/marks/MarksCard'
import SimpleCollectionScreen from '../../../components/common/SimpleCollectionScreen'
import api from '../../../utils/api'

const StudentMarksScreen = () => {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    void api.get('/marks/my').then((response) => {
      const marks = response.data?.marks || response.data || []
      setChartData(marks.slice(0, 6).map((item, index) => ({
        label: item.subject?.code || `S${index + 1}`,
        value: item.marksObtained ?? item.score ?? 0
      })))
    }).catch(() => null)
  }, [])

  return (
    <SimpleCollectionScreen
      endpoint="/marks/my"
      title="Marks"
      subtitle="Track published marks and your latest results."
      responseKey="marks"
      beforeList={(
        <AppCard>
          <MarksChart data={chartData} />
        </AppCard>
      )}
      renderItem={({ item }) => <MarksCard item={item} />}
      emptyTitle="No marks published yet"
      emptyDescription="Published marks will appear here after your instructors or coordinators release them."
    />
  )
}

export default StudentMarksScreen
