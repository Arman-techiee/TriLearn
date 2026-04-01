const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  assignInstructor,
  getSubjectEnrollments,
  updateSubjectEnrollments
} = require('../controllers/subject.controller')

// All routes protected
router.use(protect)

// Admin only
router.post('/', allowRoles('ADMIN'), validate(schemas.subjects.create), createSubject)
router.put('/:id', allowRoles('ADMIN'), validate(schemas.subjects.update), updateSubject)
router.delete('/:id', allowRoles('ADMIN'), validate(schemas.subjects.id), deleteSubject)
router.patch('/:id/assign-instructor', allowRoles('ADMIN'), validate(schemas.subjects.assignInstructor), assignInstructor)
router.get('/:id/enrollments', allowRoles('ADMIN', 'INSTRUCTOR'), validate(schemas.subjects.id), getSubjectEnrollments)
router.put('/:id/enrollments', allowRoles('ADMIN'), validate(schemas.subjects.updateEnrollments), updateSubjectEnrollments)

// Admin + Instructor + Student can view
router.get('/', allowRoles('ADMIN', 'INSTRUCTOR', 'STUDENT'), validate(schemas.subjects.getAll), getAllSubjects)
router.get('/:id', allowRoles('ADMIN', 'INSTRUCTOR', 'STUDENT'), validate(schemas.subjects.id), getSubjectById)

module.exports = router
