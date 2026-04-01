const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')
const {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} = require('../controllers/notice.controller')

router.use(protect)

// Admin + Instructor can create/update/delete
router.post('/', allowRoles('ADMIN', 'INSTRUCTOR'), validate(schemas.notices.create), createNotice)
router.put('/:id', allowRoles('ADMIN', 'INSTRUCTOR'), validate(schemas.notices.update), updateNotice)
router.delete('/:id', allowRoles('ADMIN', 'INSTRUCTOR'), validate(schemas.notices.id), deleteNotice)

// Everyone can view
router.get('/', allowRoles('ADMIN', 'INSTRUCTOR', 'STUDENT'), validate(schemas.notices.getAll), getAllNotices)
router.get('/:id', allowRoles('ADMIN', 'INSTRUCTOR', 'STUDENT'), validate(schemas.notices.id), getNoticeById)

module.exports = router
