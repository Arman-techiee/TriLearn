import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const LoadingSpinner = ({ fullScreen = false }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={palette.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24
  },
  fullScreen: {
    flex: 1
  }
})

export default LoadingSpinner
