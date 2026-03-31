const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const {
  generateDailyAttendanceQR,
  generateQR,
  markAttendanceQR,
  markDailyAttendanceQR,
  markAttendanceManual,
  getAttendanceBySubject,
  getMyAttendance,
  getSubjectRoster
} = require('../controllers/attendance.controller')

router.use(protect)

// Instructor routes
router.post('/generate-daily-qr', allowRoles('GATEKEEPER'), generateDailyAttendanceQR)
router.post('/generate-qr', allowRoles('INSTRUCTOR'), generateQR)
router.post('/manual', allowRoles('INSTRUCTOR'), markAttendanceManual)
router.get('/subject/:subjectId/roster', allowRoles('INSTRUCTOR', 'ADMIN'), getSubjectRoster)
router.get('/subject/:subjectId', allowRoles('INSTRUCTOR', 'ADMIN'), getAttendanceBySubject)

// Student routes
router.post('/scan-daily-qr', allowRoles('STUDENT'), markDailyAttendanceQR)
router.post('/scan-qr', allowRoles('STUDENT'), markAttendanceQR)
router.get('/my', allowRoles('STUDENT'), getMyAttendance)

module.exports = router
