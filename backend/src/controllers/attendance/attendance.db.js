const {
  prisma,
  getOwnedSubject,
  getSubjectStudents,
  getDailyGateWindows,
  getStudentScheduledRoutinesForDay,
  getStudentByIdCardQr,
  getStudentByRollNumber,
  upsertPresentAttendanceForRoutines,
  getEligibleGateAttendanceForStudent,
  syncClosedRoutineAbsences,
  getAttendanceExportPayload,
  getCoordinatorDepartmentReportPayload,
  recordAuditLog
} = require('../../services/attendance/shared.service')

module.exports = {
  prisma,
  getOwnedSubject,
  getSubjectStudents,
  getDailyGateWindows,
  getStudentScheduledRoutinesForDay,
  getStudentByIdCardQr,
  getStudentByRollNumber,
  upsertPresentAttendanceForRoutines,
  getEligibleGateAttendanceForStudent,
  syncClosedRoutineAbsences,
  getAttendanceExportPayload,
  getCoordinatorDepartmentReportPayload,
  recordAuditLog
}
