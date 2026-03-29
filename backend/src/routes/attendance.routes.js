const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const {
  generateQR,
  markAttendanceQR,
  markAttendanceManual,
  getAttendanceBySubject,
  getMyAttendance
} = require('../controllers/attendance.controller')

router.use(protect)

// Instructor routes
router.post('/generate-qr', allowRoles('INSTRUCTOR'), generateQR)
router.post('/manual', allowRoles('INSTRUCTOR'), markAttendanceManual)
router.get('/subject/:subjectId', allowRoles('INSTRUCTOR', 'ADMIN'), getAttendanceBySubject)

// Student routes
router.post('/scan-qr', allowRoles('STUDENT'), markAttendanceQR)
router.get('/my', allowRoles('STUDENT'), getMyAttendance)

module.exports = router