import { StyleSheet, Text, View } from 'react-native'
import Screen from './Screen'
import AppCard from './AppCard'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import PageHeader from './PageHeader'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { spacing } from '../../constants/layout'

const ResourceScreen = ({
  title,
  subtitle,
  beforeList = null,
  items,
  loading,
  error,
  onRefresh,
  renderItem,
  keyExtractor,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Data will appear here once it becomes available.'
}) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <Screen onRefresh={onRefresh} refreshing={loading && Array.isArray(items) && items.length > 0}>
      <PageHeader title={title} subtitle={subtitle} />
      <ErrorMessage message={error} />
      {beforeList}
      {loading && (!items || items.length === 0) ? <LoadingSpinner /> : null}
      {!loading && (!items || items.length === 0) ? (
        <AppCard>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </AppCard>
      ) : null}
      {items?.length ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={keyExtractor(item, index)}>
              {renderItem({ item, index })}
            </View>
          ))}
          <Text style={[styles.footer, { color: palette.textMuted }]}>Synced from the live TriLearn API.</Text>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  footer: {
    marginTop: spacing.sm,
    fontSize: 12,
    textAlign: 'center'
  }
})

export default ResourceScreen
