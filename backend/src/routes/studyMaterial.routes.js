const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const { attachActorProfiles } = require('../middleware/profile.middleware')
const { uploadPdf, validateUploadedPdf } = require('../middleware/upload.middleware')
const { staffUploadLimiter } = require('../middleware/rateLimit.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')
const {
  createMaterial,
  getMaterialsBySubject,
  getAllMaterials,
  deleteMaterial
} = require('../controllers/studyMaterial.controller')

router.use(protect)
router.use(attachActorProfiles)

// Instructor routes
router.post('/', allowRoles('INSTRUCTOR', 'COORDINATOR'), staffUploadLimiter, uploadPdf.single('materialPdf'), validateUploadedPdf, validate(schemas.materials.create), createMaterial)
router.delete('/:id', allowRoles('INSTRUCTOR', 'COORDINATOR', 'ADMIN'), validate(schemas.materials.id), deleteMaterial)

// All roles can view
router.get('/', allowRoles('ADMIN', 'COORDINATOR', 'INSTRUCTOR', 'STUDENT'), getAllMaterials)
router.get('/subject/:subjectId', allowRoles('ADMIN', 'COORDINATOR', 'INSTRUCTOR', 'STUDENT'), validate(schemas.materials.bySubject), getMaterialsBySubject)

module.exports = router
