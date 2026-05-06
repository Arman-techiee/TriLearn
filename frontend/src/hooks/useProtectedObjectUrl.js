import { useEffect, useState } from 'react'
import { fetchFileBlob, resolveFileUrl } from '../utils/api'

const SAFE_IMAGE_BLOB_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
])

export const isSafeImageBlob = (blob) => SAFE_IMAGE_BLOB_TYPES.has(String(blob?.type || '').toLowerCase())

const useProtectedObjectUrl = (fileUrl) => {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    const resolvedUrl = resolveFileUrl(fileUrl)

    if (!resolvedUrl) {
      setObjectUrl(null)
      return undefined
    }

    let revokedUrl = null
    const controller = new AbortController()

    const loadFile = async () => {
      try {
        const { blob } = await fetchFileBlob(resolvedUrl, { signal: controller.signal })
        if (controller.signal.aborted) {
          return
        }

        if (!isSafeImageBlob(blob)) {
          setObjectUrl(null)
          return
        }

        revokedUrl = window.URL.createObjectURL(blob)
        setObjectUrl(revokedUrl)
      } catch {
        if (!controller.signal.aborted) {
          setObjectUrl(null)
        }
      }
    }

    void loadFile()

    return () => {
      controller.abort()
      if (revokedUrl) {
        window.URL.revokeObjectURL(revokedUrl)
      }
    }
  }, [fileUrl])

  return objectUrl
}

export default useProtectedObjectUrl
