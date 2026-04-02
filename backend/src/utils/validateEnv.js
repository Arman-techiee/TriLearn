const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'NODE_ENV'
]

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }
}

module.exports = validateEnv
