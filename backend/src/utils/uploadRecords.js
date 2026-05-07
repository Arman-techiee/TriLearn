const path = require('path')
const prisma = require('./prisma')

const attachUploadedFileToEntity = async (file, entityType, entityId) => {
  if (!file?.filename || !entityType || !entityId || !prisma.uploadedFile?.updateMany) {
    return
  }

  await prisma.uploadedFile.updateMany({
    where: { fileName: path.basename(String(file.filename)) },
    data: {
      entityType,
      entityId
    }
  })
}

module.exports = {
  attachUploadedFileToEntity
}
