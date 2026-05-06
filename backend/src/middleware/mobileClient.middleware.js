const crypto = require('crypto')

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const CLIENT_SIGNATURE_PATTERN = /^[0-9a-fA-F]{64}$/

const parseSemverCore = (version) => {
  const [core] = String(version || '').split(/[-+]/)
  const parts = core.split('.').map((part) => Number.parseInt(part, 10))

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    return null
  }

  return parts
}

const compareSemver = (left, right) => {
  const leftParts = parseSemverCore(left)
  const rightParts = parseSemverCore(right)

  if (!leftParts || !rightParts) {
    return null
  }

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1
    if (leftParts[index] < rightParts[index]) return -1
  }

  return 0
}

const getMinimumMobileVersion = () => String(process.env.MIN_MOBILE_VERSION || '').trim()

const getMobileClientSharedSecret = () => String(process.env.MOBILE_CLIENT_SHARED_SECRET || '').trim()

const buildMobileClientSignature = (secret, clientType, clientVersion, appPlatform, timestampWindow) => {
  return crypto
    .createHmac('sha256', secret)
    .update(`${clientType}:${clientVersion}:${appPlatform}:${timestampWindow}`)
    .digest('hex')
}

const hasMatchingSignature = (providedSignature, expectedSignature) => {
  const provided = Buffer.from(providedSignature, 'hex')
  const expected = Buffer.from(expectedSignature, 'hex')

  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected)
}

const hasValidMobileClientHeaders = (req) => {
  const secret = getMobileClientSharedSecret()
  if (!secret) {
    return false
  }

  const clientType = String(req.get('x-client-type') || '')
  if (clientType !== 'mobile') {
    return false
  }

  const providedSignature = String(req.get('x-client-signature') || '').trim()
  if (!CLIENT_SIGNATURE_PATTERN.test(providedSignature)) {
    return false
  }

  const clientVersion = String(req.get('x-client-version') || '')
  const appPlatform = String(req.get('x-app-platform') || '')
  const currentWindow = Math.floor(Date.now() / 30000)

  /*
   * CSRF exemption requires a signed mobile client identity. Header presence can
   * be spoofed by any HTTP client, but an HMAC proves the sender knows the shared
   * app secret without transmitting that secret on each request.
   */
  return [currentWindow, currentWindow - 1].some((timestampWindow) => {
    const expectedSignature = buildMobileClientSignature(
      secret,
      clientType,
      clientVersion,
      appPlatform,
      timestampWindow
    )

    return hasMatchingSignature(providedSignature, expectedSignature)
  })
}

const validateMobileClient = (req, res, next) => {
  const clientType = String(req.get('x-client-type') || '').trim().toLowerCase()
  const appVersion = String(req.get('x-app-version') || '').trim()

  if (clientType !== 'mobile' || !SEMVER_PATTERN.test(appVersion)) {
    return res.status(400).json({ message: 'Missing mobile client headers.' })
  }

  req.mobileAppVersion = appVersion
  if (req.logger && typeof req.logger.child === 'function') {
    req.logger = req.logger.child({ mobileAppVersion: appVersion })
  }

  const minVersion = getMinimumMobileVersion()
  if (minVersion) {
    const versionComparison = compareSemver(appVersion, minVersion)
    if (versionComparison === null || versionComparison < 0) {
      return res.status(426).json({
        message: 'Please update the TriLearn app',
        minVersion
      })
    }
  }

  return next()
}

module.exports = {
  SEMVER_PATTERN,
  compareSemver,
  hasValidMobileClientHeaders,
  validateMobileClient
}
