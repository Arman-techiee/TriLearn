const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')
const {
  getAllUsers,
  getUserById,
  createGatekeeper,
  createInstructor,
  createStudent,
  updateUser,
  toggleUserStatus,
  deleteUser
} = require('../controllers/admin.controller')

// All admin routes are protected
router.use(protect)
router.use(allowRoles('ADMIN'))

router.get('/users', validate(schemas.admin.getAllUsers), getAllUsers)
router.get('/users/:id', validate(schemas.admin.userId), getUserById)
router.post('/users/gatekeeper', validate(schemas.admin.createGatekeeper), createGatekeeper)
router.post('/users/instructor', validate(schemas.admin.createInstructor), createInstructor)
router.post('/users/student', validate(schemas.admin.createStudent), createStudent)
router.put('/users/:id', validate(schemas.admin.updateUser), updateUser)
router.patch('/users/:id/toggle-status', validate(schemas.admin.userId), toggleUserStatus)
router.delete('/users/:id', validate(schemas.admin.userId), deleteUser)

module.exports = router
