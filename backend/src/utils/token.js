const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10)

const getAccessSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured')
  }

  return process.env.JWT_SECRET
}

const getRefreshSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET must be configured')
  }

  return process.env.JWT_REFRESH_SECRET
}

const signAccessToken = (user) => jwt.sign(
  { id: user.id, role: user.role, type: 'access' },
  getAccessSecret(),
  { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
)

const signRefreshToken = (user) => jwt.sign(
  {
    id: user.id,
    role: user.role,
    type: 'refresh',
    jti: crypto.randomUUID()
  },
  getRefreshSecret(),
  { expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d` }
)

const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret())

const hashToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex')

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)
  return expiresAt
}

const getRequestHost = (req) => String(req?.hostname || req?.headers?.host || '')
  .split(':')[0]
  .trim()
  .toLowerCase()

const isLocalHost = (host) => ['localhost', '127.0.0.1', '::1'].includes(host)

const isSecureRequest = (req) => {
  const forwardedProto = String(req?.headers?.['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase()

  return req?.secure === true || forwardedProto === 'https'
}

const getRefreshCookieOptions = (req) => {
  const secure = isSecureRequest(req) || !isLocalHost(getRequestHost(req))

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/api/v1/auth',
    expires: getRefreshTokenExpiry()
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  getRefreshCookieOptions
}
