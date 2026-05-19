export const normalizeApiBaseUrl = (rawValue) => {
  const fallbackUrl = 'http://localhost:5000/api/v1'
  const trimmedValue = String(rawValue || '').trim()

  if (!trimmedValue) {
    return fallbackUrl
  }

  if (/\/api\/v\d+\/?$/i.test(trimmedValue)) {
    return trimmedValue.replace(/\/+$/, '')
  }

  if (/\/api\/?$/i.test(trimmedValue)) {
    return `${trimmedValue.replace(/\/+$/, '')}/v1`
  }

  return `${trimmedValue.replace(/\/+$/, '')}/api/v1`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
export const API_ORIGIN = API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, '')
