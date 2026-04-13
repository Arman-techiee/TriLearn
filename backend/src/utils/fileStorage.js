const fs = require('fs')
const path = require('path')

const backendRoot = path.resolve(__dirname, '..', '..')

const normalizePublicPath = (value, fallback = '/api/v1/uploads') => {
  const normalizedValue = String(value || fallback).trim()
  if (!normalizedValue) {
    return fallback
  }

  return `/${normalizedValue.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

const resolveUploadPath = (value) => {
  if (!value) {
    return path.join(backendRoot, 'uploads')
  }

  if (path.isAbsolute(value)) {
    return value
  }

  const normalizedValue = String(value).trim().replace(/^[.][/\\]/, '')
  const backendPrefixedValue = normalizedValue.replace(/^backend[/\\]/i, '')

  return path.resolve(backendRoot, backendPrefixedValue)
}

const uploadPath = resolveUploadPath(process.env.UPLOAD_DIR)
const legacyUploadPaths = [...new Set([
  path.join(backendRoot, 'backend', 'uploads')
].filter((candidatePath) => candidatePath !== uploadPath))]

const uploadPublicPath = normalizePublicPath(process.env.UPLOAD_PUBLIC_PATH, '/api/v1/uploads')
const uploadPublicPaths = [...new Set([
  uploadPublicPath,
  '/api/v1/uploads',
  '/uploads'
])]
const uploadBaseUrl = (process.env.UPLOAD_BASE_URL || '').trim().replace(/\/$/, '')

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

const buildUploadedFileUrl = (file) => {
  if (!file?.filename) return undefined

  const relativePath = `${uploadPublicPath}/${file.filename}`
  return uploadBaseUrl ? `${uploadBaseUrl}${relativePath}` : relativePath
}

module.exports = {
  uploadPath,
  legacyUploadPaths,
  uploadPublicPath,
  uploadPublicPaths,
  buildUploadedFileUrl
}
