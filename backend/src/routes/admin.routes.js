const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const {
  getAllUsers,
  getUserById,
  createInstructor,
  createStudent,
  updateUser,
  toggleUserStatus,
  deleteUser
} = require('../controllers/admin.controller')

// All admin routes are protected
router.use(protect)
router.use(allowRoles('ADMIN'))

router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.post('/users/instructor', createInstructor)
router.post('/users/student', createStudent)
router.put('/users/:id', updateUser)
router.patch('/users/:id/toggle-status', toggleUserStatus)
router.delete('/users/:id', deleteUser)

module.exports = router