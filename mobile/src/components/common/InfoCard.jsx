import { StyleSheet, Text } from 'react-native'
import AppCard from './AppCard'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'

const InfoCard = ({ title, subtitle, extra }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <AppCard>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text> : null}
      {extra ? <Text style={[styles.extra, { color: palette.textMuted }]}>{extra}</Text> : null}
    </AppCard>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13
  },
  extra: {
    marginTop: 4,
    fontSize: 13
  }
})

export default InfoCard
