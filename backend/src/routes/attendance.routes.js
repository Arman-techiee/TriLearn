const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')
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
router.post('/generate-qr', allowRoles('INSTRUCTOR'), validate(schemas.attendance.generateQr), generateQR)
router.post('/manual', allowRoles('INSTRUCTOR'), validate(schemas.attendance.manual), markAttendanceManual)
router.get('/subject/:subjectId/roster', allowRoles('INSTRUCTOR', 'ADMIN'), validate(schemas.attendance.getBySubject), getSubjectRoster)
router.get('/subject/:subjectId', allowRoles('INSTRUCTOR', 'ADMIN'), validate(schemas.attendance.getBySubject), getAttendanceBySubject)

// Student routes
router.post('/scan-daily-qr', allowRoles('STUDENT'), validate(schemas.attendance.scanQr), markDailyAttendanceQR)
router.post('/scan-qr', allowRoles('STUDENT'), validate(schemas.attendance.scanQr), markAttendanceQR)
router.get('/my', allowRoles('STUDENT'), getMyAttendance)

module.exports = router
