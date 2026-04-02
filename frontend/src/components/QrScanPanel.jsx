import { useEffect, useRef, useState } from 'react'
import { Camera, Square, Upload } from 'lucide-react'
import logger from '../utils/logger'

const QrScanPanel = ({
  title,
  description,
  submitLabel = 'Submit QR',
  onSubmit,
  accentClassName = 'focus:ring-green-500',
  busy = false
}) => {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerSupported, setScannerSupported] = useState(false)
  const [scannerStatus, setScannerStatus] = useState('Tap start scanner to use your camera.')
  const [manualQrData, setManualQrData] = useState('')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setScannerSupported(
      typeof window !== 'undefined' &&
      'BarcodeDetector' in window &&
      !!navigator.mediaDevices?.getUserMedia
    )

    return () => {
      stopScanner()
    }
  }, [])

  const stopScanner = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const handleSubmit = async (qrValue) => {
    if (!qrValue?.trim()) return
    await onSubmit(qrValue.trim())
    setManualQrData('')
    setScannerOpen(false)
    stopScanner()
  }

  const startScanner = async () => {
    if (!scannerSupported) {
      setScannerStatus('Live camera scanning is not supported on this device. Use the manual QR text box below.')
      return
    }

    try {
      setScannerOpen(true)
      setScannerStatus('Opening camera...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      setScannerStatus('Point your camera at the student ID QR.')

      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || busy) return

        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0 && codes[0].rawValue) {
            stopScanner()
            setScannerStatus('QR detected. Submitting...')
            await handleSubmit(codes[0].rawValue)
          }
        } catch (detectError) {
          logger.error(detectError)
        }
      }, 800)
    } catch (cameraError) {
      logger.error(cameraError)
      setScannerStatus('Unable to access the camera. You can still paste the QR data manually.')
      stopScanner()
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={startScanner}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            <span>Start Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopScanner()
              setScannerOpen(false)
              setScannerStatus('Scanner stopped.')
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <Square className="h-4 w-4" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">{scannerStatus}</p>

      {scannerOpen ? (
        <div className="mt-4 overflow-hidden rounded-2xl border bg-black">
          <video ref={videoRef} className="max-h-[320px] w-full object-cover" muted playsInline />
        </div>
      ) : null}

      <div className="mt-5 border-t pt-5">
        <label className="mb-2 block text-sm text-gray-600">Manual QR Data</label>
        <textarea
          rows={4}
          value={manualQrData}
          onChange={(event) => setManualQrData(event.target.value)}
          placeholder="Paste the student ID QR payload here if camera scanning is unavailable."
          className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 ${accentClassName}`}
        />
        <button
          type="button"
          onClick={() => handleSubmit(manualQrData)}
          disabled={!manualQrData.trim() || busy}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          <span>{busy ? 'Submitting...' : submitLabel}</span>
        </button>
      </div>
    </div>
  )
}

export default QrScanPanel
