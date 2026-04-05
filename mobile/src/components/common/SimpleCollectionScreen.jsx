import { useEffect } from 'react'
import api from '../../utils/api'
import useApi from '../../hooks/useApi'
import ResourceScreen from './ResourceScreen'

const getItemsFromResponse = (response, responseKey) => {
  if (typeof responseKey === 'function') {
    return responseKey(response)
  }

  if (responseKey) {
    return response?.data?.[responseKey] || []
  }

  const data = response?.data
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  const firstArray = Object.values(data || {}).find(Array.isArray)
  return firstArray || []
}

const SimpleCollectionScreen = ({
  endpoint,
  title,
  subtitle,
  responseKey,
  beforeList = null,
  renderItem,
  keyExtractor = (item, index) => String(item?.id || item?._id || index),
  emptyTitle,
  emptyDescription
}) => {
  const { data, loading, error, execute } = useApi({ initialData: [] })

  const load = () => execute(
    (signal) => api.get(endpoint, { signal }),
    {
      transform: (response) => getItemsFromResponse(response, responseKey)
    }
  )

  useEffect(() => {
    void load()
  }, [endpoint])

  return (
    <ResourceScreen
      title={title}
      subtitle={subtitle}
      items={data}
      loading={loading}
      error={error}
      onRefresh={load}
      beforeList={beforeList}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  )
}

export default SimpleCollectionScreen
