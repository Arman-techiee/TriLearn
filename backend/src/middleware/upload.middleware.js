const fs = require('fs')
const path = require('path')
const multer = require('multer')
const logger = require('../utils/logger')

const uploadRoot = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot)
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    cb(null, `${Date.now()}-${safeName}`)
  }
})

const pdfOnly = (_req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')

  if (!isPdf) {
    return cb(new Error('Only PDF files are allowed'))
  }

  cb(null, true)
}

const uploadPdf = multer({
  storage,
  fileFilter: pdfOnly,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

const validateUploadedPdf = async (req, res, next) => {
  if (!req.file?.path) {
    return next()
  }

  try {
    const fileHandle = await fs.promises.open(req.file.path, 'r')
    const signatureBuffer = Buffer.alloc(5)
    await fileHandle.read(signatureBuffer, 0, 5, 0)
    await fileHandle.close()

    if (signatureBuffer.toString() !== '%PDF-') {
      await fs.promises.unlink(req.file.path).catch(() => {})
      return res.status(400).json({ message: 'Uploaded file content is not a valid PDF' })
    }

    next()
  } catch (error) {
    logger.error(error.message, { stack: error.stack })
    await fs.promises.unlink(req.file.path).catch(() => {})
    res.status(400).json({ message: 'Unable to validate uploaded file' })
  }
}

module.exports = { uploadPdf, uploadRoot, validateUploadedPdf }
