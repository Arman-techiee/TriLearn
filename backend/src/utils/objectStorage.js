const fs = require('fs')
const path = require('path')
const logger = require('./logger')

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

let s3Client = null
let localStorageWarningShown = false

const getS3Config = () => {
  const bucket = String(process.env.S3_BUCKET || '').trim()
  const region = String(process.env.S3_REGION || '').trim()
  const accessKeyId = String(process.env.S3_ACCESS_KEY || '').trim()
  const secretAccessKey = String(process.env.S3_SECRET_KEY || '').trim()
  const endpoint = String(process.env.S3_ENDPOINT || '').trim()
  const forcePathStyle = String(process.env.S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true'

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null
  }

  return { bucket, region, accessKeyId, secretAccessKey, endpoint, forcePathStyle }
}

const isS3Configured = () => Boolean(getS3Config())

const buildUploadedFileUrl = (file) => {
  if (file?.url) return file.url
  if (!file?.filename) return undefined

  const relativePath = `${uploadPublicPath}/${file.filename}`
  return uploadBaseUrl ? `${uploadBaseUrl}${relativePath}` : relativePath
}

const ensureLocalUploadDirectory = async () => {
  await fs.promises.mkdir(uploadPath, { recursive: true })
}

const getS3Client = () => {
  const config = getS3Config()
  if (!config) {
    return null
  }

  if (!s3Client) {
    const { S3Client } = require('@aws-sdk/client-s3')
    s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  }

  return s3Client
}

const uploadFile = async (fileBuffer, fileName, mimeType) => {
  const s3Config = getS3Config()
  const s3 = getS3Client()

  if (s3Config && s3) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3')
    try {
      await s3.send(new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType
      }))
    } catch (error) {
      logger.error('S3 upload failed', {
        message: error.message,
        stack: error.stack,
        bucket: s3Config.bucket,
        region: s3Config.region,
        endpoint: s3Config.endpoint || null,
        forcePathStyle: s3Config.forcePathStyle
      })
      throw error
    }

    return {
      url: buildUploadedFileUrl({ filename: fileName })
    }
  }

  if (!localStorageWarningShown) {
    localStorageWarningShown = true
    logger.warn('Warning: S3 storage is not configured; uploaded files are stored on local disk and are not shared across instances')
  }

  await ensureLocalUploadDirectory()
  await fs.promises.writeFile(path.join(uploadPath, fileName), fileBuffer)

  return { url: buildUploadedFileUrl({ filename: fileName }) }
}

const deleteFile = async (fileUrl) => {
  if (!fileUrl) return

  const fileName = path.basename(String(fileUrl))
  if (!fileName) return

  const s3Config = getS3Config()
  const s3 = getS3Client()

  if (s3Config && s3) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    await s3.send(new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: decodeURIComponent(fileName)
    }))
    return
  }

  await fs.promises.unlink(path.join(uploadPath, fileName)).catch(() => {})
}

const getSafeResponseHeaderValue = (value) => String(value || '')
  .replace(/[\r\n"]/g, '_')
  .trim()

const getPresignedDownloadUrl = async (fileName, options = {}) => {
  const s3Config = getS3Config()
  const s3 = getS3Client()

  if (!s3Config || !s3) {
    return null
  }

  const { GetObjectCommand } = require('@aws-sdk/client-s3')
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

  const downloadName = getSafeResponseHeaderValue(options.downloadName || path.basename(String(fileName || '')))
  const contentType = getSafeResponseHeaderValue(options.contentType || 'application/octet-stream')

  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: decodeURIComponent(fileName),
    ResponseContentDisposition: `attachment; filename="${downloadName || 'download'}"`,
    ResponseContentType: contentType || 'application/octet-stream'
  }), {
    expiresIn: Number.parseInt(process.env.S3_PRESIGNED_URL_TTL_SECONDS || '300', 10)
  })
}

module.exports = {
  uploadPath,
  legacyUploadPaths,
  uploadPublicPath,
  uploadPublicPaths,
  buildUploadedFileUrl,
  isS3Configured,
  uploadFile,
  getPresignedDownloadUrl,
  deleteFile
}
