import { Modal, StyleSheet, Text, View } from 'react-native'
import AppButton from './AppButton'
import AppCard from './AppCard'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { spacing } from '../../constants/layout'

const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <AppCard style={styles.card}>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
          <View style={styles.actions}>
            <AppButton title="Cancel" variant="secondary" onPress={onCancel} style={styles.action} />
            <AppButton title={confirmLabel} onPress={onConfirm} style={styles.action} />
          </View>
        </AppCard>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(8, 15, 24, 0.45)'
  },
  card: {
    gap: spacing.md
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  message: {
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  action: {
    flex: 1
  }
})

export default ConfirmModal
