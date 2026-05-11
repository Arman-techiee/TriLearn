const logger = require('./logger')

let sentry = null
let initialized = false

const parseSampleRate = (value, fallback = 0) => {
  const parsed = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback
}

const getEnvironment = () => process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'

const sanitizeExtra = (value) => JSON.parse(JSON.stringify(value || {}, (_key, nestedValue) => {
  if (nestedValue instanceof Error) {
    return {
      message: nestedValue.message,
      stack: nestedValue.stack
    }
  }

  return nestedValue
}))

const initMonitoring = () => {
  const dsn = String(process.env.SENTRY_DSN || '').trim()

  if (!dsn || initialized) {
    return { enabled: Boolean(sentry), sentry }
  }

  try {
    sentry = require('@sentry/node')
    sentry.init({
      dsn,
      environment: getEnvironment(),
      release: process.env.SENTRY_RELEASE || undefined,
      tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0),
      sendDefaultPii: false
    })
    initialized = true
    logger.info('Sentry monitoring enabled', { environment: getEnvironment() })
  } catch (error) {
    sentry = null
    logger.warn('Sentry monitoring requested but could not be initialized', {
      message: error.message
    })
  }

  return { enabled: Boolean(sentry), sentry }
}

const captureException = (error, context = {}) => {
  if (!sentry) {
    return null
  }

  return sentry.withScope((scope) => {
    if (context.level) {
      scope.setLevel(context.level)
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          scope.setTag(key, String(value))
        }
      })
    }

    if (context.user) {
      scope.setUser(context.user)
    }

    if (context.extra) {
      scope.setExtras(sanitizeExtra(context.extra))
    }

    return sentry.captureException(error)
  })
}

const captureRequestException = (error, req) => captureException(error, {
  tags: {
    requestId: req?.id,
    method: req?.method,
    route: req?.originalUrl
  },
  user: req?.user?.id ? { id: req.user.id, role: req.user.role } : undefined,
  extra: {
    ip: req?.ip,
    mobileAppVersion: req?.mobileAppVersion
  }
})

const flushMonitoring = async (timeoutMs = 2000) => {
  if (!sentry?.flush) {
    return false
  }

  return sentry.flush(timeoutMs)
}

module.exports = {
  initMonitoring,
  captureException,
  captureRequestException,
  flushMonitoring,
  parseSampleRate
}
