const {
  getAttendanceExportPayload,
  getCoordinatorDepartmentReportPayload,
  exportAttendancePdf,
  exportAttendanceWorkbook,
  exportCoordinatorDepartmentReportPdf,
  exportCoordinatorDepartmentReportWorkbook,
  syncClosedRoutineAbsences
} = require('./shared')

const exportCoordinatorDepartmentAttendanceReport = async (req, res) => {
  try {
    const { month, semester, section, format = 'xlsx' } = req.query
    const report = await getCoordinatorDepartmentReportPayload({
      coordinator: req.coordinator,
      month,
      semester,
      section
    })

    if (report.error) {
      return res.status(report.error.status).json({ message: report.error.message })
    }

    if (format === 'pdf') {
      exportCoordinatorDepartmentReportPdf({ res, report })
      return
    }

    await exportCoordinatorDepartmentReportWorkbook({ res, report })
  } catch (error) {
    res.internalError(error)
  }
}

const exportAttendanceBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params
    const { date, month, format = 'xlsx' } = req.query

    await syncClosedRoutineAbsences(date ? new Date(date) : new Date())

    const report = await getAttendanceExportPayload({
      subjectId,
      date,
      month,
      req
    })

    if (report.error) {
      return res.status(report.error.status).json({ message: report.error.message })
    }

    if (format === 'pdf') {
      exportAttendancePdf({ res, ...report })
      return
    }

    await exportAttendanceWorkbook({ res, ...report })
  } catch (error) {
    res.internalError(error)
  }
}

module.exports = {
  exportCoordinatorDepartmentAttendanceReport,
  exportAttendanceBySubject
}
