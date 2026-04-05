import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { spacing } from '../../constants/layout'

const Screen = ({ children, scroll = true, refreshing = false, onRefresh }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg
  }
})

export default Screen
