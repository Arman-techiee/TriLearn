import { Modal, StyleSheet, Text, View } from 'react-native'
import { CameraView } from 'expo-camera'
import AppButton from '../common/AppButton'
import { useTheme } from '../../context/ThemeContext'
import colors from '../../constants/colors'
import { spacing } from '../../constants/layout'

const QrScannerModal = ({ visible, onClose, onScan, enabled = true }) => {
  const { resolvedTheme } = useTheme()
  const palette = colors[resolvedTheme]

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.text }]}>Scan QR Code</Text>
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={enabled ? onScan : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ['qr']
            }}
          />
        </View>
        <Text style={[styles.note, { color: palette.textMuted }]}>Align the QR code inside the frame and keep the phone steady.</Text>
        <AppButton title="Close" variant="secondary" onPress={onClose} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg
  },
  title: {
    fontSize: 22,
    fontWeight: '800'
  },
  cameraWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden'
  },
  camera: {
    flex: 1
  },
  note: {
    fontSize: 14,
    textAlign: 'center'
  }
})

export default QrScannerModal
