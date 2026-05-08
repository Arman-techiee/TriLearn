const https = require('node:https')
const logger = require('./logger')

const FCM_LEGACY_HOST = 'fcm.googleapis.com'
const FCM_LEGACY_PATH = '/fcm/send'
const MAX_FCM_SEND_ATTEMPTS = 2
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504])
const STALE_ERROR_CODES = new Set([
  'NotRegistered',
  'InvalidRegistration',
  'UNREGISTERED'
])

const normalizeDataPayload = (data = {}) => Object.entries(data || {}).reduce((acc, [key, value]) => {
  if (value === undefined || value === null) {
    return acc
  }

  acc[key] = typeof value === 'string' ? value : JSON.stringify(value)
  return acc
}, {})

const getTokenSuffix = (token) => String(token || '').slice(-8)

const parseFcmResponseBody = (text) => {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

const buildTokenResult = ({
  token,
  success = false,
  skipped = false,
  status = null,
  messageId = null,
  errorCode = null,
  errorMessage = null
}) => ({
  token,
  success,
  skipped,
  status,
  messageId,
  errorCode,
  errorMessage,
  stale: status === 404 || STALE_ERROR_CODES.has(errorCode),
  retryable: RETRYABLE_STATUS_CODES.has(status)
})

const postFcmPayload = ({ serverKey, payload }) => new Promise((resolve, reject) => {
  const requestBody = JSON.stringify(payload)
  const request = https.request({
    hostname: FCM_LEGACY_HOST,
    path: FCM_LEGACY_PATH,
    method: 'POST',
    headers: {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  }, (response) => {
    const chunks = []

    response.on('data', (chunk) => {
      chunks.push(chunk)
    })

    response.on('end', () => {
      resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        status: response.statusCode,
        statusText: response.statusMessage,
        body: Buffer.concat(chunks).toString('utf8')
      })
    })
  })

  request.on('error', reject)
  request.write(requestBody)
  request.end()
})

const sendToToken = async ({ token, title, body, data, serverKey }) => {
  const response = await postFcmPayload({
    serverKey,
    payload: {
      to: token,
      notification: {
        title,
        body
      },
      data: normalizeDataPayload(data)
    }
  })

  const payload = parseFcmResponseBody(response.body)
  const result = payload?.results?.[0] || payload || {}
  const errorCode = result.error || payload?.error?.status || payload?.error
  const messageId = result.message_id || result.messageId || payload?.name || null

  if (response.ok && !errorCode) {
    return buildTokenResult({
      token,
      success: true,
      status: response.status,
      messageId
    })
  }

  return buildTokenResult({
    token,
    status: response.status,
    messageId,
    errorCode,
    errorMessage: payload?.error?.message || result.message || response.statusText
  })
}

const sendPushNotification = async (tokens = [], title, body, data = {}) => {
  const uniqueTokens = [...new Set(tokens.filter(Boolean))]
  const serverKey = String(process.env.FCM_SERVER_KEY || '').trim()

  if (!uniqueTokens.length) {
    return []
  }

  if (!serverKey) {
    return uniqueTokens.map((token) => {
      const result = buildTokenResult({ token, skipped: true, errorCode: 'FCM_SERVER_KEY_MISSING' })
      logger.warn('FCM push skipped because FCM_SERVER_KEY is not configured', {
        tokenSuffix: getTokenSuffix(token)
      })
      return result
    })
  }

  return Promise.all(uniqueTokens.map(async (token) => {
    try {
      let result

      for (let attempt = 1; attempt <= MAX_FCM_SEND_ATTEMPTS; attempt += 1) {
        result = await sendToToken({ token, title, body, data, serverKey })

        if (!result.retryable || attempt === MAX_FCM_SEND_ATTEMPTS) {
          break
        }

        logger.warn('Retrying FCM push after transient failure', {
          tokenSuffix: getTokenSuffix(token),
          status: result.status,
          errorCode: result.errorCode,
          attempt
        })
      }

      if (result.success) {
        logger.info('FCM push delivered', {
          tokenSuffix: getTokenSuffix(token),
          status: result.status,
          messageId: result.messageId
        })
      } else {
        logger.warn('FCM push failed', {
          tokenSuffix: getTokenSuffix(token),
          status: result.status,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          stale: result.stale,
          retryable: result.retryable
        })
      }

      return result
    } catch (error) {
      logger.error('FCM push failed', {
        tokenSuffix: getTokenSuffix(token),
        message: error.message,
        stack: error.stack,
        retryable: true
      })

      return buildTokenResult({
        token,
        errorCode: 'FCM_REQUEST_FAILED',
        errorMessage: error.message
      })
    }
  }))
}

module.exports = {
  sendPushNotification
}
