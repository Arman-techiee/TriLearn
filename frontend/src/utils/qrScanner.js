import jsQR from 'jsqr'

const QR_SCAN_INTERVAL_MS = 800

export const canUseCameraQrScanner = () => (
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia
)

export const getQrScanIntervalMs = () => QR_SCAN_INTERVAL_MS

const canUseBarcodeDetector = () => (
  typeof window !== 'undefined' &&
  'BarcodeDetector' in window
)

const getBarcodeDetector = (detectorRef) => {
  if (!detectorRef.current && canUseBarcodeDetector()) {
    detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
  }

  return detectorRef.current
}

const scanWithJsQr = (video, canvasRef) => {
  const width = video.videoWidth
  const height = video.videoHeight

  if (!width || !height) {
    return null
  }

  const canvas = canvasRef.current || document.createElement('canvas')
  canvasRef.current = canvas
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return null
  }

  context.drawImage(video, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const code = jsQR(imageData.data, width, height)
  return code?.data || null
}

export const detectQrFromVideo = async ({ video, detectorRef, canvasRef }) => {
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null
  }

  const detector = getBarcodeDetector(detectorRef)
  if (detector) {
    const codes = await detector.detect(video)
    return codes[0]?.rawValue || null
  }

  return scanWithJsQr(video, canvasRef)
}
