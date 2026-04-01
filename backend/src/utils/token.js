const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10)

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET

const signAccessToken = (user) => jwt.sign(
  { id: user.id, role: user.role, type: 'access' },
  process.env.JWT_SECRET,
  { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
)

const signRefreshToken = (user) => jwt.sign(
  { id: user.id, role: user.role, type: 'refresh' },
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

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
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
