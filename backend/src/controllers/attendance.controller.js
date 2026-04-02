const prisma = require('../utils/prisma')
const crypto = require('crypto')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const QRCode = require('qrcode')
const logger = require('../utils/logger')
const { getPagination } = require('../utils/pagination')
const { recordAuditLog } = require('../utils/audit')

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE']
const QR_VALIDITY_MINUTES = 15
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || 'edunexus-qr-secret'

const getDayRange = (dateValue) => {
  const baseDate = dateValue ? new Date(dateValue) : new Date()

  if (Number.isNaN(baseDate.getTime())) {
    return null
  }

  const start = new Date(baseDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

const getMonthRange = (monthValue) => {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) {
    return null
  }

  const [year, month] = monthValue.split('-').map((value) => parseInt(value, 10))
  const start = new Date(year, month - 1, 1)

  if (Number.isNaN(start.getTime())) {
    return null
  }

  start.setHours(0, 0, 0, 0)
  const end = new Date(year, month, 1)
  end.setHours(0, 0, 0, 0)

  return { start, end }
}

const getOwnedSubject = async (subjectId, req) => {
  const { user, instructor } = req
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      instructor: {
        include: {
          user: { select: { name: true, email: true } }
        }
      }
    }
  })

  if (!subject) {
    return { error: { status: 404, message: 'Subject not found' } }
  }

  if (user.role === 'INSTRUCTOR') {
    if (!instructor) {
      return { error: { status: 403, message: 'Instructor profile not found' } }
    }

    if (!subject.instructorId) {
      return { error: { status: 403, message: 'Assign an instructor to this subject before managing attendance' } }
    }

    if (subject.instructorId !== instructor.id) {
      return { error: { status: 403, message: 'You can only manage attendance for your assigned subjects' } }
    }

    return { subject, instructor }
  }

  return { subject }
}

const getSubjectStudents = async (subject) => {
  const students = await prisma.student.findMany({
    where: {
      user: { isActive: true },
      subjectEnrollments: {
        some: {
          subjectId: subject.id
        }
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          isActive: true
        }
      }
    },
    orderBy: [
      { rollNumber: 'asc' },
      { enrolledAt: 'asc' }
    ]
  })

  return students
}

const buildAttendanceSummary = (attendance) => {
  const totals = attendance.reduce((acc, record) => {
    acc.total += 1
    acc[record.status] += 1
    return acc
  }, { total: 0, PRESENT: 0, ABSENT: 0, LATE: 0 })

  return {
    total: totals.total,
    present: totals.PRESENT,
    absent: totals.ABSENT,
    late: totals.LATE
  }
}

const buildStatusSummary = (groups) => {
  const totals = groups.reduce((acc, group) => {
    acc.total += group._count._all
    acc[group.status] = group._count._all
    return acc
  }, { total: 0, PRESENT: 0, ABSENT: 0, LATE: 0 })

  return {
    total: totals.total,
    present: totals.PRESENT,
    absent: totals.ABSENT,
    late: totals.LATE
  }
}

const getCurrentDayName = (date = new Date()) => DAYS[date.getDay()]

const toMinutes = (timeValue) => {
  const [hours, minutes] = timeValue.split(':').map((value) => parseInt(value, 10))
  return (hours * 60) + minutes
}

const buildDateWithTime = (baseDate, timeValue) => {
  const date = new Date(baseDate)
  const [hours, minutes] = timeValue.split(':').map((value) => parseInt(value, 10))
  date.setHours(hours, minutes, 0, 0)
  return date
}

const normalizeSemesterList = (semesters = []) => (
  [...new Set(
    semesters
      .map((value) => parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12)
  )].sort((left, right) => left - right)
)

const hasPrismaDelegateMethod = (delegate, methodName) => (
  Boolean(delegate && typeof delegate[methodName] === 'function')
)

const hasAbsenceTicketDelegate = () => hasPrismaDelegateMethod(prisma.absenceTicket, 'findMany')
const hasAttendanceHolidayDelegate = () => hasPrismaDelegateMethod(prisma.attendanceHoliday, 'findFirst')

const respondAttendanceTicketUnavailable = (res) => (
  res.status(503).json({
    message: 'Attendance tickets are not available yet. Run the latest Prisma generate and migrations for this feature.'
  })
)

const getGateWindowRange = (baseDate, gateWindow) => ({
  startsAt: buildDateWithTime(baseDate, gateWindow.startTime),
  endsAt: buildDateWithTime(baseDate, gateWindow.endTime)
})

const rangesOverlap = (leftStart, leftEnd, rightStart, rightEnd) => (
  leftStart < rightEnd && leftEnd > rightStart
)

const getHolidayForDate = async (referenceDate = new Date()) => {
  if (!hasAttendanceHolidayDelegate()) {
    return null
  }

  const dayRange = getDayRange(referenceDate)
  return prisma.attendanceHoliday.findFirst({
    where: {
      date: dayRange.start,
      isActive: true
    }
  })
}

const getDailyGateWindows = async (referenceDate = new Date()) => {
  const dayRange = getDayRange(referenceDate)
  const dayOfWeek = getCurrentDayName(dayRange.start)
  const holiday = await getHolidayForDate(dayRange.start)

  const windows = await prisma.gateScanWindow.findMany({
    where: {
      dayOfWeek,
      isActive: true
    },
    orderBy: { startTime: 'asc' }
  })

  const enrichedWindows = windows.map((window) => {
    const range = getGateWindowRange(dayRange.start, window)
    return {
      ...window,
      allowedSemesters: normalizeSemesterList(window.allowedSemesters),
      startsAt: range.startsAt,
      endsAt: range.endsAt
    }
  })

  const active = []
  let nextWindow = null
  const semesterCutoffMap = new Map()

  enrichedWindows.forEach((window) => {
    window.allowedSemesters.forEach((semester) => {
      const currentCutoff = semesterCutoffMap.get(semester)
      if (!currentCutoff || window.endsAt > currentCutoff) {
        semesterCutoffMap.set(semester, window.endsAt)
      }
    })

    if (referenceDate >= window.startsAt && referenceDate <= window.endsAt) {
      active.push(window)
      return
    }

    if (referenceDate < window.startsAt) {
      if (!nextWindow || window.startsAt < nextWindow.startsAt) {
        nextWindow = window
      }
    }
  })

  return {
    dayRange,
    dayOfWeek,
    holiday,
    windows: enrichedWindows,
    active,
    nextWindow,
    semesterCutoffMap
  }
}

const dedupeRoutinesBySubject = (routines) => {
  const routineMap = new Map()

  routines.forEach((routine) => {
    if (!routineMap.has(routine.subjectId)) {
      routineMap.set(routine.subjectId, routine)
    }
  })

  return [...routineMap.values()]
}

const getStudentScheduledRoutinesForDay = async ({ studentId, dayOfWeek }) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      semester: true,
      section: true,
      department: true
    }
  })

  if (!student) {
    return []
  }

  const routines = await prisma.routine.findMany({
    where: {
      dayOfWeek,
      semester: student.semester,
      department: student.department || null,
      OR: student.section
        ? [{ section: null }, { section: student.section }]
        : [{ section: null }, { section: '' }],
      subject: {
        enrollments: {
          some: {
            studentId
          }
        }
      }
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          semester: true,
          department: true
        }
      }
    },
    orderBy: { startTime: 'asc' }
  })

  return dedupeRoutinesBySubject(routines)
}

const filterRoutinesForSemesterWindows = ({ routines, baseDate, semester, windows }) => {
  if (!windows.length) {
    return []
  }

  return routines.filter((routine) => {
    const routineStart = buildDateWithTime(baseDate, routine.startTime)
    const routineEnd = buildDateWithTime(baseDate, routine.endTime)

    return windows.some((window) => (
      window.allowedSemesters.includes(semester) &&
      rangesOverlap(routineStart, routineEnd, window.startsAt, window.endsAt)
    ))
  })
}

const getStudentByIdCardQr = async (qrData) => {
  const parsedQr = parseQrPayload(qrData)
  if (!parsedQr || parsedQr.type !== 'STUDENT_ID_CARD' || !parsedQr.studentId) {
    return { error: { status: 400, message: 'Invalid student ID QR code' } }
  }

  const student = await prisma.student.findUnique({
    where: { id: parsedQr.studentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      }
    }
  })

  if (!student || !student.user?.isActive) {
    return { error: { status: 404, message: 'Student was not found or is inactive' } }
  }

  return { student, parsedQr }
}

const upsertPresentAttendanceForRoutines = async ({ student, routines, attendanceDate, qrData, actorRole, actorId }) => {
  const existingAttendance = await prisma.attendance.findMany({
    where: {
      studentId: student.id,
      subjectId: { in: routines.map((routine) => routine.subjectId) },
      date: { gte: attendanceDate.start, lt: attendanceDate.end }
    }
  })

  const existingMap = new Map(existingAttendance.map((record) => [record.subjectId, record]))
  const routinesToMark = routines.filter((routine) => !existingMap.has(routine.subjectId))

  if (!routinesToMark.length) {
    return { error: { status: 400, message: 'Attendance has already been recorded for the applicable class entries.' } }
  }

  const records = await prisma.$transaction(
    routinesToMark.map((routine) => (
      prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: student.id,
            subjectId: routine.subjectId,
            date: attendanceDate.start
          }
        },
        update: {
          instructorId: routine.instructorId,
          status: 'PRESENT',
          qrCode: qrData
        },
        create: {
          studentId: student.id,
          subjectId: routine.subjectId,
          instructorId: routine.instructorId,
          status: 'PRESENT',
          qrCode: qrData,
          date: attendanceDate.start
        }
      })
    ))
  )

  await recordAuditLog({
    actorId,
    actorRole,
    action: 'STUDENT_ID_QR_ATTENDANCE_MARKED',
    entityType: 'Attendance',
    metadata: {
      studentId: student.id,
      subjectIds: records.map((record) => record.subjectId),
      date: attendanceDate.start
    }
  })

  return {
    records,
    markedSubjects: routinesToMark.map((routine) => ({
      id: routine.subjectId,
      name: routine.subject.name,
      code: routine.subject.code,
      startTime: routine.startTime,
      endTime: routine.endTime
    }))
  }
}

const getEligibleGateAttendanceForStudent = async (student, referenceDate = new Date()) => {
  const gateDay = await getDailyGateWindows(referenceDate)

  if (gateDay.holiday) {
    return { error: { status: 400, message: `Today is marked as a holiday: ${gateDay.holiday.title}` } }
  }

  const eligibleWindows = gateDay.active.filter((window) => window.allowedSemesters.includes(student.semester))

  if (!eligibleWindows.length) {
    return { error: { status: 400, message: 'There is no active Student QR time slot for this student right now.' } }
  }

  const studentDayRoutines = await getStudentScheduledRoutinesForDay({
    studentId: student.id,
    dayOfWeek: gateDay.dayOfWeek
  })

  const routines = filterRoutinesForSemesterWindows({
    routines: studentDayRoutines,
    baseDate: gateDay.dayRange.start,
    semester: student.semester,
    windows: eligibleWindows
  })

  if (!routines.length) {
    return { error: { status: 400, message: 'This student has no scheduled subject in the active Student QR time slot.' } }
  }

  return { gateDay, eligibleWindows, routines }
}

const syncClosedRoutineAbsences = async (referenceDate = new Date()) => {
  const gateDay = await getDailyGateWindows(referenceDate)

  if (gateDay.holiday || !gateDay.windows.length) {
    return
  }

  const students = await prisma.student.findMany({
    where: {
      user: { isActive: true }
    },
    select: {
      id: true,
      semester: true,
      department: true,
      section: true
    }
  })

  if (!students.length) {
    return
  }

  const routines = dedupeRoutinesBySubject(await prisma.routine.findMany({
    where: {
      dayOfWeek: gateDay.dayOfWeek
    },
    include: {
      subject: {
        select: {
          id: true,
          enrollments: {
            select: {
              studentId: true
            }
          }
        }
      }
    },
    orderBy: { startTime: 'asc' }
  }))

  if (!routines.length) {
    return
  }

  const subjectIds = routines.map((routine) => routine.subjectId)
  const existingAttendance = await prisma.attendance.findMany({
    where: {
      subjectId: { in: subjectIds },
      date: { gte: gateDay.dayRange.start, lt: gateDay.dayRange.end }
    },
    select: {
      studentId: true,
      subjectId: true
    }
  })

  const existingKeys = new Set(existingAttendance.map((record) => `${record.studentId}:${record.subjectId}`))
  const absencesToCreate = []

  students.forEach((student) => {
    const closedWindowsForSemester = gateDay.windows.filter((window) => (
      window.allowedSemesters.includes(student.semester) &&
      referenceDate > window.endsAt
    ))

    if (!closedWindowsForSemester.length) {
      return
    }

    const semesterRoutines = filterRoutinesForSemesterWindows({
      routines: routines.filter((routine) => (
        routine.subject.enrollments.some((enrollment) => enrollment.studentId === student.id) &&
        routine.semester === student.semester &&
        (routine.department || null) === (student.department || null) &&
        (!routine.section || routine.section === student.section)
      )),
      baseDate: gateDay.dayRange.start,
      semester: student.semester,
      windows: closedWindowsForSemester
    })

    semesterRoutines.forEach((routine) => {
      const key = `${student.id}:${routine.subjectId}`
      if (existingKeys.has(key)) {
        return
      }

      existingKeys.add(key)
      absencesToCreate.push({
        studentId: student.id,
        subjectId: routine.subjectId,
        instructorId: routine.instructorId,
        status: 'ABSENT',
        date: gateDay.dayRange.start
      })
    })
  })

  if (absencesToCreate.length > 0) {
    await prisma.attendance.createMany({
      data: absencesToCreate,
      skipDuplicates: true
    })
  }
}

const parseQrPayload = (qrData) => {
  try {
    const parsed = JSON.parse(qrData)
    if (!parsed || typeof parsed !== 'object') return null

    const payload = parsed.payload
    const signature = parsed.signature

    if (!payload || typeof payload !== 'object' || typeof signature !== 'string') {
      return null
    }

    const expectedSignature = crypto
      .createHmac('sha256', QR_SIGNING_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex')

    const receivedSignature = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (
      receivedSignature.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(receivedSignature, expectedBuffer)
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

const createSignedQrPayload = (payload) => {
  const signature = crypto
    .createHmac('sha256', QR_SIGNING_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex')

  return JSON.stringify({ payload, signature })
}

const formatDisplayDate = (dateValue) => new Date(dateValue).toLocaleDateString('en-CA')
const formatMonthLabel = (monthValue) => {
  const range = getMonthRange(monthValue)
  if (!range) return monthValue
  return range.start.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

const sanitizeFilenamePart = (value) => String(value || 'report').replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()

const getAttendanceExportPayload = async ({ subjectId, date, month, req }) => {
  const access = await getOwnedSubject(subjectId, req)
  if (access.error) {
    return { error: access.error }
  }

  const filters = { subjectId }
  const dayRange = date ? getDayRange(date) : null
  const monthRange = month ? getMonthRange(month) : null

  if (date && !dayRange) {
    return { error: { status: 400, message: 'Please provide a valid date filter' } }
  }

  if (month && !monthRange) {
    return { error: { status: 400, message: 'Please provide a valid month filter' } }
  }

  if (dayRange && monthRange) {
    return { error: { status: 400, message: 'Use either a date or a month filter, not both' } }
  }

  if (dayRange) {
    filters.date = { gte: dayRange.start, lt: dayRange.end }
  } else if (monthRange) {
    filters.date = { gte: monthRange.start, lt: monthRange.end }
  }

  const [attendance, groupedSummary] = await Promise.all([
    prisma.attendance.findMany({
      where: filters,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        subject: { select: { name: true, code: true } }
      },
      orderBy: [
        { date: 'desc' },
        { student: { rollNumber: 'asc' } }
      ]
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: filters,
      _count: { _all: true }
    })
  ])

  return {
    attendance,
    summary: buildStatusSummary(groupedSummary),
    subject: access.subject,
    dateLabel: dayRange ? formatDisplayDate(dayRange.start) : monthRange ? formatMonthLabel(month) : 'All dates'
  }
}

const exportAttendancePdf = ({ res, attendance, summary, subject, dateLabel }) => {
  const fileName = `attendance-${sanitizeFilenamePart(subject.code || subject.name)}-${sanitizeFilenamePart(dateLabel)}.pdf`
  const doc = new PDFDocument({ margin: 40, size: 'A4' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

  doc.pipe(res)
  doc.fontSize(18).text('Attendance Report', { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(12).text(`Subject: ${subject.name} (${subject.code})`)
  doc.text(`Date: ${dateLabel}`)
  doc.text(`Generated: ${formatDisplayDate(new Date())}`)
  doc.moveDown()

  doc.fontSize(12).text(`Total Records: ${summary.total}`)
  doc.text(`Present: ${summary.present}`)
  doc.text(`Absent: ${summary.absent}`)
  doc.text(`Late: ${summary.late}`)
  doc.moveDown()

  attendance.forEach((record, index) => {
    if (doc.y > 730) {
      doc.addPage()
    }

    const studentName = record.student?.user?.name || 'Unknown Student'
    const rollNumber = record.student?.rollNumber || '-'
    const studentEmail = record.student?.user?.email || '-'

    doc
      .fontSize(10)
      .text(`${index + 1}. ${studentName}`)
      .text(`Roll: ${rollNumber} | Email: ${studentEmail}`)
      .text(`Date: ${formatDisplayDate(record.date)} | Status: ${record.status}`)
      .moveDown(0.5)
  })

  doc.end()
}

const exportAttendanceWorkbook = async ({ res, attendance, summary, subject, dateLabel }) => {
  const workbook = new ExcelJS.Workbook()
  const summarySheet = workbook.addWorksheet('Summary')
  const recordsSheet = workbook.addWorksheet('Records')
  const fileName = `attendance-${sanitizeFilenamePart(subject.code || subject.name)}-${sanitizeFilenamePart(dateLabel)}.xlsx`

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 24 },
    { header: 'Value', key: 'value', width: 32 }
  ]
  summarySheet.addRows([
    { metric: 'Subject', value: `${subject.name} (${subject.code})` },
    { metric: 'Date', value: dateLabel },
    { metric: 'Total Records', value: summary.total },
    { metric: 'Present', value: summary.present },
    { metric: 'Absent', value: summary.absent },
    { metric: 'Late', value: summary.late }
  ])

  recordsSheet.columns = [
    { header: 'S.N.', key: 'sn', width: 8 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'Roll Number', key: 'rollNumber', width: 20 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Status', key: 'status', width: 14 }
  ]
  attendance.forEach((record, index) => {
    recordsSheet.addRow({
      sn: index + 1,
      name: record.student?.user?.name || 'Unknown Student',
      rollNumber: record.student?.rollNumber || '-',
      email: record.student?.user?.email || '-',
      date: formatDisplayDate(record.date),
      status: record.status
    })
  })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  await workbook.xlsx.write(res)
  res.end()
}

const getCoordinatorDepartmentReportPayload = async ({ coordinator, month, semester, section }) => {
  if (!coordinator || !coordinator.department) {
    return { error: { status: 403, message: 'Coordinator department is not configured yet' } }
  }

  const monthRange = getMonthRange(month)
  if (!monthRange) {
    return { error: { status: 400, message: 'Please provide a valid month in YYYY-MM format' } }
  }

  const normalizedSemester = parseInt(semester, 10)
  const studentFilters = {
    department: coordinator.department,
    semester: normalizedSemester,
    user: { isActive: true }
  }

  if (section) {
    studentFilters.section = section
  }

  const students = await prisma.student.findMany({
    where: studentFilters,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { rollNumber: 'asc' },
      { enrolledAt: 'asc' }
    ]
  })

  const studentIds = students.map((student) => student.id)
  const attendance = studentIds.length > 0
    ? await prisma.attendance.findMany({
        where: {
          studentId: { in: studentIds },
          date: { gte: monthRange.start, lt: monthRange.end }
        },
        include: {
          subject: { select: { name: true, code: true } },
          student: {
            include: {
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { subject: { code: 'asc' } },
          { student: { rollNumber: 'asc' } }
        ]
      })
    : []

  const attendanceByStudent = new Map()
  attendance.forEach((record) => {
    const list = attendanceByStudent.get(record.studentId) || []
    list.push(record)
    attendanceByStudent.set(record.studentId, list)
  })

  const studentSummaries = students.map((student) => {
    const records = attendanceByStudent.get(student.id) || []
    const counts = records.reduce((acc, record) => {
      acc.total += 1
      acc[record.status] += 1
      return acc
    }, { total: 0, PRESENT: 0, ABSENT: 0, LATE: 0 })

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      semester: student.semester,
      section: student.section,
      present: counts.PRESENT,
      absent: counts.ABSENT,
      late: counts.LATE,
      totalRecords: counts.total,
      monthlyAverage: counts.total > 0 ? ((counts.PRESENT / counts.total) * 100).toFixed(1) : '0.0'
    }
  })

  return {
    department: coordinator.department,
    month,
    monthLabel: formatMonthLabel(month),
    semester: normalizedSemester,
    section: section || '',
    totalStudents: students.length,
    summary: buildAttendanceSummary(attendance),
    students: studentSummaries,
    records: attendance.map((record) => ({
      id: record.id,
      date: record.date,
      status: record.status,
      subject: record.subject,
      student: {
        id: record.student.id,
        name: record.student.user.name,
        email: record.student.user.email,
        rollNumber: record.student.rollNumber,
        section: record.student.section
      }
    }))
  }
}

const exportCoordinatorDepartmentReportPdf = ({ res, report }) => {
  const fileName = `department-attendance-${sanitizeFilenamePart(report.department)}-sem-${report.semester}-${sanitizeFilenamePart(report.monthLabel)}${report.section ? `-section-${sanitizeFilenamePart(report.section)}` : ''}.pdf`
  const doc = new PDFDocument({ margin: 40, size: 'A4' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

  doc.pipe(res)
  doc.fontSize(18).text('Department Attendance Report', { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(12).text(`Department: ${report.department}`)
  doc.text(`Semester: ${report.semester}`)
  doc.text(`Section: ${report.section || 'All sections'}`)
  doc.text(`Month: ${report.monthLabel}`)
  doc.moveDown()

  doc.text(`Total Students: ${report.totalStudents}`)
  doc.text(`Present Entries: ${report.summary.present}`)
  doc.text(`Absent Entries: ${report.summary.absent}`)
  doc.text(`Late Entries: ${report.summary.late}`)
  doc.moveDown()

  doc.fontSize(13).text('Student Monthly Averages')
  doc.moveDown(0.5)

  report.students.forEach((student, index) => {
    if (doc.y > 730) doc.addPage()
    doc
      .fontSize(10)
      .text(`${index + 1}. ${student.name} (${student.rollNumber})`)
      .text(`Section: ${student.section || '-'} | Present: ${student.present} | Absent: ${student.absent} | Late: ${student.late} | Average: ${student.monthlyAverage}%`)
      .moveDown(0.4)
  })

  if (report.records.length > 0) {
    doc.addPage()
    doc.fontSize(13).text('Attendance Record List')
    doc.moveDown(0.5)
    report.records.forEach((record, index) => {
      if (doc.y > 730) doc.addPage()
      doc
        .fontSize(10)
        .text(`${index + 1}. ${record.student.name} (${record.student.rollNumber})`)
        .text(`Subject: ${record.subject.name} (${record.subject.code})`)
        .text(`Date: ${formatDisplayDate(record.date)} | Status: ${record.status}`)
        .moveDown(0.4)
    })
  }

  doc.end()
}

const exportCoordinatorDepartmentReportWorkbook = async ({ res, report }) => {
  const workbook = new ExcelJS.Workbook()
  const summarySheet = workbook.addWorksheet('Summary')
  const studentsSheet = workbook.addWorksheet('Student Averages')
  const recordsSheet = workbook.addWorksheet('Attendance Records')
  const fileName = `department-attendance-${sanitizeFilenamePart(report.department)}-sem-${report.semester}-${sanitizeFilenamePart(report.monthLabel)}${report.section ? `-section-${sanitizeFilenamePart(report.section)}` : ''}.xlsx`

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 24 },
    { header: 'Value', key: 'value', width: 32 }
  ]
  summarySheet.addRows([
    { metric: 'Department', value: report.department },
    { metric: 'Semester', value: report.semester },
    { metric: 'Section', value: report.section || 'All sections' },
    { metric: 'Month', value: report.monthLabel },
    { metric: 'Total Students', value: report.totalStudents },
    { metric: 'Present Entries', value: report.summary.present },
    { metric: 'Absent Entries', value: report.summary.absent },
    { metric: 'Late Entries', value: report.summary.late }
  ])

  studentsSheet.columns = [
    { header: 'S.N.', key: 'sn', width: 8 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'Roll Number', key: 'rollNumber', width: 20 },
    { header: 'Section', key: 'section', width: 14 },
    { header: 'Present', key: 'present', width: 12 },
    { header: 'Absent', key: 'absent', width: 12 },
    { header: 'Late', key: 'late', width: 12 },
    { header: 'Monthly Average %', key: 'monthlyAverage', width: 18 }
  ]
  report.students.forEach((student, index) => {
    studentsSheet.addRow({
      sn: index + 1,
      name: student.name,
      rollNumber: student.rollNumber,
      section: student.section || '-',
      present: student.present,
      absent: student.absent,
      late: student.late,
      monthlyAverage: student.monthlyAverage
    })
  })

  recordsSheet.columns = [
    { header: 'S.N.', key: 'sn', width: 8 },
    { header: 'Student Name', key: 'studentName', width: 28 },
    { header: 'Roll Number', key: 'rollNumber', width: 18 },
    { header: 'Subject', key: 'subjectName', width: 28 },
    { header: 'Subject Code', key: 'subjectCode', width: 16 },
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Status', key: 'status', width: 14 }
  ]
  report.records.forEach((record, index) => {
    recordsSheet.addRow({
      sn: index + 1,
      studentName: record.student.name,
      rollNumber: record.student.rollNumber,
      subjectName: record.subject.name,
      subjectCode: record.subject.code,
      date: formatDisplayDate(record.date),
      status: record.status
    })
  })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  await workbook.xlsx.write(res)
  res.end()
}

// ================================
// GENERATE QR CODE (Instructor)
// ================================
const generateQR = async (req, res) => {
  try {
    const { subjectId } = req.body

    const access = await getOwnedSubject(subjectId, req)
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const { subject } = access
    const instructorId = access.instructor?.id || subject.instructorId

    if (!instructorId) {
      return res.status(400).json({ message: 'Assign an instructor to this subject before managing attendance' })
    }

    // Create QR data with timestamp (valid for 10 minutes)
    const qrData = createSignedQrPayload({
      subjectId,
      instructorId,
      date: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    })

    // Generate QR code as base64 image
    const qrCode = await QRCode.toDataURL(qrData)

    res.json({
      message: 'QR Code generated successfully!',
      qrCode,
      expiresIn: '10 minutes',
      subjectId,
      instructorId
    })

  } catch (error) {
    res.internalError(error)
  }
}

// ================================
// MARK ATTENDANCE VIA QR (Student)
// ================================
const markAttendanceQR = async (req, res) => {
  try {
    const { qrData } = req.body

    const student = req.student

    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' })
    }

    const parsedQR = parseQrPayload(qrData)
    if (!parsedQR) {
      return res.status(400).json({ message: 'Invalid QR code' })
    }

    // Check if QR is expired
    if (new Date() > new Date(parsedQR.expiresAt)) {
      return res.status(400).json({ message: 'QR code has expired' })
    }

    const { subjectId, instructorId } = parsedQR
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' })
    }

    const enrollment = await prisma.subjectEnrollment.findUnique({
      where: {
        subjectId_studentId: {
          subjectId,
          studentId: student.id
        }
      }
    })

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not eligible to mark attendance for this subject' })
    }

    // Check if already marked today
    const todayRange = getDayRange()

    let attendance

    try {
      attendance = await prisma.attendance.create({
        data: {
          studentId: student.id,
          subjectId,
          instructorId,
          status: 'PRESENT',
          qrCode: qrData,
          date: todayRange.start
        },
        include: {
          subject: { select: { name: true, code: true } },
          student: { include: { user: { select: { name: true } } } }
        }
      })
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Attendance already marked for today' })
      }

      throw error
    }

    res.status(201).json({
      message: 'Attendance marked successfully!',
      attendance: {
        id: attendance.id,
        student: attendance.student.user.name,
        subject: attendance.subject.name,
        status: attendance.status,
        date: attendance.date
      }
    })

    await recordAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ATTENDANCE_MARKED_BY_QR',
      entityType: 'Attendance',
      entityId: attendance.id,
      metadata: {
        subjectId,
        attendanceDate: todayRange.start
      }
    })

  } catch (error) {
    res.internalError(error)
  }
}

// ================================
// MARK ATTENDANCE MANUALLY (Instructor)
// ================================
const markAttendanceManual = async (req, res) => {
  try {
    const { subjectId, attendanceDate, attendanceList } = req.body

    const access = await getOwnedSubject(subjectId, req)
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const instructorId = access.instructor?.id || access.subject.instructorId
    if (!instructorId) {
      return res.status(400).json({ message: 'Assign an instructor to this subject before managing attendance' })
    }

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one attendance entry' })
    }

    const dayRange = getDayRange(attendanceDate)
    if (!dayRange) {
      return res.status(400).json({ message: 'Please provide a valid attendance date' })
    }

    const subjectStudents = await getSubjectStudents(access.subject)
    const allowedStudentIds = new Set(subjectStudents.map((student) => student.id))

    const invalidEntry = attendanceList.find(({ studentId, status }) => (
      !studentId || !allowedStudentIds.has(studentId) || !ATTENDANCE_STATUSES.includes(status)
    ))

    if (invalidEntry) {
      return res.status(400).json({ message: 'Attendance list contains invalid student or status values' })
    }

    const records = await prisma.$transaction(
      attendanceList.map(({ studentId, status }) => {
        return prisma.attendance.upsert({
          where: {
            studentId_subjectId_date: {
              studentId,
              subjectId,
              date: dayRange.start
            }
          },
          update: {
            status,
            instructorId,
            qrCode: null,
            date: dayRange.start
          },
          create: {
            studentId,
            subjectId,
            instructorId,
            status,
            date: dayRange.start
          }
        })
      })
    )

    res.status(201).json({
      message: 'Attendance marked successfully!',
      total: records.length,
      records,
      date: dayRange.start
    })

    await recordAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ATTENDANCE_MARKED_MANUALLY',
      entityType: 'Attendance',
      entityId: subjectId,
      metadata: {
        subjectId,
        attendanceDate: dayRange.start,
        totalRecords: records.length
      }
    })

  } catch (error) {
    res.internalError(error)
  }
}

// ================================
// GET ATTENDANCE BY SUBJECT (Instructor)
// ================================
const getAttendanceBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params
    const { date } = req.query
    const { page, limit, skip } = getPagination(req.query)

    await syncClosedRoutineAbsences(date ? new Date(date) : new Date())

    const access = await getOwnedSubject(subjectId, req)
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const filters = { subjectId }
    const dayRange = date ? getDayRange(date) : null

    if (date && !dayRange) {
      return res.status(400).json({ message: 'Please provide a valid date filter' })
    }

    if (dayRange) {
      filters.date = { gte: dayRange.start, lt: dayRange.end }
    }

    const [attendance, total, groupedSummary] = await Promise.all([
      prisma.attendance.findMany({
        where: filters,
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } }
            }
          },
          subject: { select: { name: true, code: true } }
        },
        orderBy: [
          { date: 'desc' },
          { student: { rollNumber: 'asc' } }
        ],
        skip,
        take: limit
      }),
      prisma.attendance.count({ where: filters }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: filters,
        _count: { _all: true }
      })
    ])

    res.json({
      total,
      page,
      limit,
      attendance,
      summary: buildStatusSummary(groupedSummary),
      subject: access.subject
    })

  } catch (error) {
    res.internalError(error)
  }
}

// ================================
// GET MY ATTENDANCE (Student)
// ================================
const getMyAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const student = req.student

    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' })
    }

    await syncClosedRoutineAbsences()

    const [attendance, total, allAttendance] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId: student.id },
        include: {
          subject: { select: { name: true, code: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.attendance.count({
        where: { studentId: student.id }
      }),
      prisma.attendance.findMany({
        where: { studentId: student.id },
        include: {
          subject: { select: { name: true, code: true } }
        }
      })
    ])

    // Calculate percentage per subject
    const subjectMap = {}
    allAttendance.forEach(a => {
      const key = a.subjectId
      if (!subjectMap[key]) {
        subjectMap[key] = { total: 0, present: 0, absent: 0, late: 0, subject: a.subject }
      }
      subjectMap[key].total++
      if (a.status === 'PRESENT') subjectMap[key].present++
      if (a.status === 'ABSENT') subjectMap[key].absent++
      if (a.status === 'LATE') subjectMap[key].late++
    })

    const summary = Object.values(subjectMap).map(s => ({
      subject: s.subject.name,
      code: s.subject.code,
      total: s.total,
      present: s.present,
      absent: s.absent,
      late: s.late,
      percentage: ((s.present / s.total) * 100).toFixed(1) + '%'
    })).sort((a, b) => a.code.localeCompare(b.code))

    res.json({ total, page, limit, attendance, summary })

  } catch (error) {
    res.internalError(error)
  }
}

const getSubjectRoster = async (req, res) => {
  try {
    const { subjectId } = req.params
    const { date } = req.query

    await syncClosedRoutineAbsences(date ? new Date(date) : new Date())

    const access = await getOwnedSubject(subjectId, req)
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const dayRange = getDayRange(date)
    if (!dayRange) {
      return res.status(400).json({ message: 'Please provide a valid date' })
    }

    const [students, attendance] = await Promise.all([
      getSubjectStudents(access.subject),
      prisma.attendance.findMany({
        where: {
          subjectId,
          date: { gte: dayRange.start, lt: dayRange.end }
        }
      })
    ])

    const attendanceMap = new Map(attendance.map((record) => [record.studentId, record]))
    const roster = students.map((student) => ({
      id: student.id,
      rollNumber: student.rollNumber,
      semester: student.semester,
      section: student.section,
      department: student.department,
      name: student.user.name,
      email: student.user.email,
      status: attendanceMap.get(student.id)?.status || 'PRESENT',
      attendanceId: attendanceMap.get(student.id)?.id || null
    }))

    res.json({
      subject: access.subject,
      date: dayRange.start,
      total: roster.length,
      roster,
      summary: buildAttendanceSummary(attendance)
    })
  } catch (error) {
    res.internalError(error)
  }
}

const getCoordinatorDepartmentAttendanceReport = async (req, res) => {
  try {
    const { month, semester, section } = req.query
    await syncClosedRoutineAbsences()
    const report = await getCoordinatorDepartmentReportPayload({
      coordinator: req.coordinator,
      month,
      semester,
      section
    })

    if (report.error) {
      return res.status(report.error.status).json({ message: report.error.message })
    }

    res.json(report)
  } catch (error) {
    res.internalError(error)
  }
}

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

const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { subjectId } = req.params
    const { month } = req.query

    await syncClosedRoutineAbsences()

    const access = await getOwnedSubject(subjectId, req)
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const monthRange = getMonthRange(month)
    if (!monthRange) {
      return res.status(400).json({ message: 'Please provide a valid month in YYYY-MM format' })
    }

    const [students, attendance] = await Promise.all([
      getSubjectStudents(access.subject),
      prisma.attendance.findMany({
        where: {
          subjectId,
          date: { gte: monthRange.start, lt: monthRange.end }
        },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { student: { rollNumber: 'asc' } }
        ]
      })
    ])

    const daysInMonth = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() + 1, 0).getDate()
    const attendanceMap = new Map()
    attendance.forEach((record) => {
      const key = `${record.studentId}:${formatDisplayDate(record.date)}`
      attendanceMap.set(key, record.status)
    })

    const studentReports = students.map((student) => {
      const dailyStatuses = []
      let present = 0
      let absent = 0
      let late = 0
      let totalRecorded = 0

      for (let day = 1; day <= daysInMonth; day += 1) {
        const currentDate = new Date(monthRange.start)
        currentDate.setDate(day)
        const dateKey = formatDisplayDate(currentDate)
        const status = attendanceMap.get(`${student.id}:${dateKey}`) || null

        if (status) {
          totalRecorded += 1
          if (status === 'PRESENT') present += 1
          if (status === 'ABSENT') absent += 1
          if (status === 'LATE') late += 1
        }

        dailyStatuses.push({
          day,
          date: dateKey,
          status
        })
      }

      return {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        rollNumber: student.rollNumber,
        semester: student.semester,
        section: student.section,
        department: student.department,
        present,
        absent,
        late,
        totalRecorded,
        percentage: totalRecorded > 0 ? ((present / totalRecorded) * 100).toFixed(1) : '0.0',
        dailyStatuses
      }
    })

    res.json({
      subject: access.subject,
      month,
      monthLabel: formatMonthLabel(month),
      summary: buildAttendanceSummary(attendance),
      totalStudents: students.length,
      totalRecords: attendance.length,
      days: Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        date: formatDisplayDate(new Date(monthRange.start.getFullYear(), monthRange.start.getMonth(), index + 1))
      })),
      students: studentReports
    })
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

// ================================
// MARK ATTENDANCE FOR TODAY'S ROUTINE (Student)
// ================================
const markDailyAttendanceQR = async (req, res) => {
  try {
    const { qrData } = req.body

    const student = req.student
    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' })
    }

    await syncClosedRoutineAbsences()

    const parsedQR = parseQrPayload(qrData)
    if (!parsedQR || parsedQR.type !== 'GATE_STUDENT_QR' || !Array.isArray(parsedQR.windowIds)) {
      return res.status(400).json({ message: 'Invalid gate attendance QR code' })
    }

    const now = new Date()
    if (new Date(parsedQR.expiresAt) <= now) {
      return res.status(400).json({ message: 'This gate QR has already rotated. Please scan the latest QR.' })
    }

    const gateDay = await getDailyGateWindows(now)
    if (gateDay.holiday) {
      return res.status(400).json({ message: `Today is marked as a holiday: ${gateDay.holiday.title}` })
    }

    if (!gateDay.active.length) {
      return res.status(400).json({ message: 'The scan time has passed for now. Please wait for the next active window.' })
    }

    const activeMap = new Map(gateDay.active.map((window) => [window.id, window]))
    const eligibleWindows = parsedQR.windowIds
      .map((windowId) => activeMap.get(windowId))
      .filter(Boolean)

    if (!eligibleWindows.length) {
      return res.status(400).json({ message: 'This gate QR is not valid for the current routine window.' })
    }

    const allowedSemesters = normalizeSemesterList([
      ...(parsedQR.allowedSemesters || []),
      ...eligibleWindows.flatMap((window) => window.allowedSemesters)
    ])

    if (!allowedSemesters.includes(student.semester)) {
      return res.status(403).json({ message: 'Your semester is not allowed to scan this Student QR right now.' })
    }

    const eligibility = await getEligibleGateAttendanceForStudent(student, now)
    if (eligibility.error) {
      return res.status(eligibility.error.status).json({ message: eligibility.error.message })
    }

    const { routines } = eligibility

    const result = await upsertPresentAttendanceForRoutines({
      student,
      routines,
      attendanceDate: gateDay.dayRange,
      qrData,
      actorRole: req.user.role,
      actorId: req.user.id
    })

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message })
    }

    const markedSubjects = result.markedSubjects

    res.status(201).json({
      message: `Attendance marked for ${markedSubjects.length} class${markedSubjects.length > 1 ? 'es' : ''}.`,
      markedSubjects,
      date: gateDay.dayRange.start,
      expiresAt: parsedQR.expiresAt
    })
  } catch (error) {
    res.internalError(error)
  }
}

const getLiveGateAttendanceQrPayload = async (req) => {
  await syncClosedRoutineAbsences()

  const now = new Date()
  const windows = await getDailyGateWindows(now)

  if (windows.holiday) {
    return {
      active: false,
      holiday: true,
      dayOfWeek: windows.dayOfWeek,
      serverTime: now.toISOString(),
      holidayInfo: {
        id: windows.holiday.id,
        title: windows.holiday.title,
        description: windows.holiday.description,
        date: windows.holiday.date.toISOString()
      },
      nextWindow: null
    }
  }

  if (!windows.active.length) {
    return {
      active: false,
      dayOfWeek: windows.dayOfWeek,
      serverTime: now.toISOString(),
      timePassed: windows.windows.length > 0 && !windows.nextWindow,
      nextWindow: windows.nextWindow
        ? {
            id: windows.nextWindow.id,
            startTime: windows.nextWindow.startTime,
            endTime: windows.nextWindow.endTime,
            startsAt: windows.nextWindow.startsAt.toISOString(),
            scanClosesAt: windows.nextWindow.endsAt.toISOString(),
            allowedSemesters: windows.nextWindow.allowedSemesters
          }
        : null
    }
  }

  const expiresAt = new Date(Math.min(
    now.getTime() + (60 * 1000),
    ...windows.active.map((window) => window.endsAt.getTime())
  ))

  const allowedSemesters = normalizeSemesterList(
    windows.active.flatMap((window) => window.allowedSemesters)
  )

  const qrData = createSignedQrPayload({
    type: 'GATE_STUDENT_QR',
    issuedBy: req.user.id,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    dayOfWeek: windows.dayOfWeek,
    windowIds: windows.active.map((window) => window.id),
    allowedSemesters
  })

  const qrCode = await QRCode.toDataURL(qrData)

  return {
    active: true,
    qrCode,
    qrData,
    dayOfWeek: windows.dayOfWeek,
    serverTime: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    refreshInSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
    allowedSemesters,
    periods: windows.active.map((window) => ({
      id: window.id,
      title: window.title,
      startTime: window.startTime,
      endTime: window.endTime,
      startsAt: window.startsAt.toISOString(),
      scanClosesAt: window.endsAt.toISOString(),
      allowedSemesters: window.allowedSemesters
    })),
    nextWindow: windows.nextWindow
      ? {
          id: windows.nextWindow.id,
          title: windows.nextWindow.title,
          startTime: windows.nextWindow.startTime,
          endTime: windows.nextWindow.endTime,
          startsAt: windows.nextWindow.startsAt.toISOString(),
          scanClosesAt: windows.nextWindow.endsAt.toISOString(),
          allowedSemesters: windows.nextWindow.allowedSemesters
        }
      : null
  }
}

const getLiveGateAttendanceQr = async (req, res) => {
  try {
    const payload = await getLiveGateAttendanceQrPayload(req)
    res.json(payload)
  } catch (error) {
    res.internalError(error)
  }
}

// ================================
// GENERATE DAILY ENTRY QR (Gatekeeper)
// ================================
const generateDailyAttendanceQR = async (req, res) => {
  try {
    const payload = await getLiveGateAttendanceQrPayload(req)

    if (!payload.active) {
      return res.status(400).json({
        message: payload.nextWindow
          ? 'There is no active attendance period right now. Please wait for the next scheduled class window.'
          : 'No routine is scheduled for today.'
      })
    }

    res.json({
      message: 'Rotating gate attendance QR generated successfully!',
      ...payload
    })

    await recordAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'DAILY_GATE_QR_GENERATED',
      entityType: 'Attendance',
      metadata: {
        windowIds: payload.periods.map((period) => period.id),
        allowedSemesters: payload.allowedSemesters,
        expiresAt: payload.expiresAt
      }
    })
  } catch (error) {
    res.internalError(error)
  }
}

const getMyAbsenceTickets = async (req, res) => {
  try {
    const student = req.student
    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' })
    }

    if (!hasAbsenceTicketDelegate()) {
      return res.json({ tickets: [], absencesWithoutTicket: [] })
    }

    await syncClosedRoutineAbsences()

    const [tickets, absencesWithoutTicket] = await Promise.all([
      prisma.absenceTicket.findMany({
        where: { studentId: student.id },
        include: {
          attendance: {
            include: {
              subject: { select: { id: true, name: true, code: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.attendance.findMany({
        where: {
          studentId: student.id,
          status: 'ABSENT',
          absenceTicket: {
            is: null
          }
        },
        include: {
          subject: { select: { id: true, name: true, code: true } }
        },
        orderBy: { date: 'desc' }
      })
    ])

    res.json({ tickets, absencesWithoutTicket })
  } catch (error) {
    res.internalError(error)
  }
}

const createAbsenceTicket = async (req, res) => {
  try {
    const student = req.student
    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' })
    }

    if (!hasAbsenceTicketDelegate()) {
      return respondAttendanceTicketUnavailable(res)
    }

    const { attendanceId, reason } = req.body
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        studentId: student.id,
        status: 'ABSENT'
      }
    })

    if (!attendance) {
      return res.status(404).json({ message: 'Absent attendance record not found' })
    }

    const existingTicket = await prisma.absenceTicket.findUnique({
      where: { attendanceId }
    })

    if (existingTicket) {
      return res.status(400).json({ message: 'A ticket already exists for this absence.' })
    }

    const ticket = await prisma.absenceTicket.create({
      data: {
        attendanceId,
        studentId: student.id,
        reason
      },
      include: {
        attendance: {
          include: {
            subject: { select: { id: true, name: true, code: true } }
          }
        }
      }
    })

    res.status(201).json({
      message: 'Absence ticket submitted successfully.',
      ticket
    })
  } catch (error) {
    res.internalError(error)
  }
}

const getAbsenceTicketsForStaff = async (req, res) => {
  try {
    if (!hasAbsenceTicketDelegate()) {
      return res.json({ tickets: [] })
    }

    const where = {}

    if (req.user.role === 'INSTRUCTOR') {
      if (!req.instructor) {
        return res.status(403).json({ message: 'Instructor profile not found' })
      }

      where.attendance = {
        instructorId: req.instructor.id
      }
    }

    if (req.user.role === 'COORDINATOR') {
      if (!req.coordinator?.department) {
        return res.status(403).json({ message: 'Coordinator department is not configured yet' })
      }

      where.attendance = {
        student: {
          department: req.coordinator.department
        }
      }
    }

    const tickets = await prisma.absenceTicket.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        attendance: {
          include: {
            subject: { select: { id: true, name: true, code: true } }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    res.json({ tickets })
  } catch (error) {
    res.internalError(error)
  }
}

const reviewAbsenceTicket = async (req, res) => {
  try {
    if (!hasAbsenceTicketDelegate()) {
      return respondAttendanceTicketUnavailable(res)
    }

    const { id } = req.params
    const { status, response } = req.body

    const existing = await prisma.absenceTicket.findUnique({
      where: { id },
      include: {
        attendance: {
          include: {
            student: true
          }
        }
      }
    })

    if (!existing) {
      return res.status(404).json({ message: 'Absence ticket not found' })
    }

    if (req.user.role === 'INSTRUCTOR' && existing.attendance.instructorId !== req.instructor?.id) {
      return res.status(403).json({ message: 'You can only review tickets for your own classes' })
    }

    if (req.user.role === 'COORDINATOR' && existing.attendance.student.department !== req.coordinator?.department) {
      return res.status(403).json({ message: 'You can only review tickets for your department' })
    }

    if (existing.status === 'APPROVED') {
      return res.status(409).json({ message: 'Approved requests are locked and cannot be edited.' })
    }

    const ticket = await prisma.absenceTicket.update({
      where: { id },
      data: {
        status,
        response,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }
    })

    res.json({
      message: 'Absence ticket reviewed successfully.',
      ticket
    })
  } catch (error) {
    res.internalError(error)
  }
}

const findConflictingGateWindow = async ({ id, dayOfWeek, startTime, endTime, allowedSemesters }) => prisma.gateScanWindow.findFirst({
  where: {
    dayOfWeek,
    isActive: true,
    id: id ? { not: id } : undefined,
    allowedSemesters: {
      hasSome: normalizeSemesterList(allowedSemesters)
    },
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } }
    ]
  }
})

const getGateAttendanceSettings = async (req, res) => {
  try {
    const { dayOfWeek } = req.query

    const [windows, holidays] = await Promise.all([
      prisma.gateScanWindow.findMany({
        where: dayOfWeek ? { dayOfWeek } : undefined,
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }),
      prisma.attendanceHoliday.findMany({
        orderBy: { date: 'asc' }
      })
    ])

    res.json({
      windows: windows.map((window) => ({
        ...window,
        allowedSemesters: normalizeSemesterList(window.allowedSemesters)
      })),
      holidays
    })
  } catch (error) {
    res.internalError(error)
  }
}

const createGateScanWindow = async (req, res) => {
  try {
    const { title, dayOfWeek, startTime, endTime, allowedSemesters, isActive = true } = req.body
    const normalizedSemesters = normalizeSemesterList(allowedSemesters)

    const conflict = await findConflictingGateWindow({
      dayOfWeek,
      startTime,
      endTime,
      allowedSemesters: normalizedSemesters
    })

    if (conflict) {
      return res.status(400).json({ message: 'This time window overlaps with another Student QR slot for one of the same semesters.' })
    }

    const window = await prisma.gateScanWindow.create({
      data: {
        title,
        dayOfWeek,
        startTime,
        endTime,
        allowedSemesters: normalizedSemesters,
        isActive
      }
    })

    res.status(201).json({
      message: 'Student QR window saved successfully.',
      window: {
        ...window,
        allowedSemesters: normalizeSemesterList(window.allowedSemesters)
      }
    })
  } catch (error) {
    res.internalError(error)
  }
}

const updateGateScanWindow = async (req, res) => {
  try {
    const { id } = req.params
    const { title, dayOfWeek, startTime, endTime, allowedSemesters, isActive = true } = req.body
    const normalizedSemesters = normalizeSemesterList(allowedSemesters)

    const existing = await prisma.gateScanWindow.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Student QR window not found' })
    }

    const conflict = await findConflictingGateWindow({
      id,
      dayOfWeek,
      startTime,
      endTime,
      allowedSemesters: normalizedSemesters
    })

    if (conflict) {
      return res.status(400).json({ message: 'This time window overlaps with another Student QR slot for one of the same semesters.' })
    }

    const window = await prisma.gateScanWindow.update({
      where: { id },
      data: {
        title,
        dayOfWeek,
        startTime,
        endTime,
        allowedSemesters: normalizedSemesters,
        isActive
      }
    })

    res.json({
      message: 'Student QR window updated successfully.',
      window: {
        ...window,
        allowedSemesters: normalizeSemesterList(window.allowedSemesters)
      }
    })
  } catch (error) {
    res.internalError(error)
  }
}

const deleteGateScanWindow = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.gateScanWindow.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Student QR window not found' })
    }

    await prisma.gateScanWindow.delete({ where: { id } })
    res.json({ message: 'Student QR window deleted successfully.' })
  } catch (error) {
    res.internalError(error)
  }
}

const createAttendanceHoliday = async (req, res) => {
  try {
    const { date, title, description, isActive = true } = req.body
    const dayRange = getDayRange(date)

    if (!dayRange) {
      return res.status(400).json({ message: 'Invalid holiday date' })
    }

    const holiday = await prisma.attendanceHoliday.upsert({
      where: { date: dayRange.start },
      update: {
        title,
        description,
        isActive
      },
      create: {
        date: dayRange.start,
        title,
        description,
        isActive
      }
    })

    res.status(201).json({
      message: 'Holiday saved successfully.',
      holiday
    })
  } catch (error) {
    res.internalError(error)
  }
}

const deleteAttendanceHoliday = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.attendanceHoliday.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Holiday not found' })
    }

    await prisma.attendanceHoliday.delete({ where: { id } })
    res.json({ message: 'Holiday removed successfully.' })
  } catch (error) {
    res.internalError(error)
  }
}

const scanStudentIdAttendance = async (req, res) => {
  try {
    const { qrData, subjectId, attendanceDate } = req.body

    const scanned = await getStudentByIdCardQr(qrData)
    if (scanned.error) {
      return res.status(scanned.error.status).json({ message: scanned.error.message })
    }

    const { student } = scanned

    if (req.user.role === 'GATEKEEPER' || !subjectId) {
      const eligibility = await getEligibleGateAttendanceForStudent(student, new Date())
      if (eligibility.error) {
        return res.status(eligibility.error.status).json({ message: eligibility.error.message })
      }

      const result = await upsertPresentAttendanceForRoutines({
        student,
        routines: eligibility.routines,
        attendanceDate: eligibility.gateDay.dayRange,
        qrData,
        actorRole: req.user.role,
        actorId: req.user.id
      })

      if (result.error) {
        return res.status(result.error.status).json({ message: result.error.message })
      }

      return res.status(201).json({
        message: `Attendance marked for ${student.user.name}.`,
        mode: 'GATE_WINDOW',
        student: {
          id: student.id,
          name: student.user.name,
          rollNumber: student.rollNumber,
          semester: student.semester,
          section: student.section
        },
        markedSubjects: result.markedSubjects,
        date: eligibility.gateDay.dayRange.start
      })
    }

    const access = await getOwnedSubject(subjectId, req)
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const dayRange = getDayRange(attendanceDate || new Date())
    if (!dayRange) {
      return res.status(400).json({ message: 'Please provide a valid attendance date.' })
    }

    const enrollment = await prisma.subjectEnrollment.findUnique({
      where: {
        subjectId_studentId: {
          subjectId,
          studentId: student.id
        }
      }
    })

    if (!enrollment) {
      return res.status(400).json({ message: 'This student is not enrolled in the selected subject.' })
    }

    const instructorId = access.instructor?.id || access.subject.instructorId
    if (!instructorId) {
      return res.status(400).json({ message: 'Assign an instructor to this subject before managing attendance.' })
    }

    const record = await prisma.attendance.upsert({
      where: {
        studentId_subjectId_date: {
          studentId: student.id,
          subjectId,
          date: dayRange.start
        }
      },
      update: {
        instructorId,
        status: 'PRESENT',
        qrCode: qrData
      },
      create: {
        studentId: student.id,
        subjectId,
        instructorId,
        status: 'PRESENT',
        qrCode: qrData,
        date: dayRange.start
      }
    })

    await recordAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'STAFF_STUDENT_ID_ATTENDANCE_MARKED',
      entityType: 'Attendance',
      metadata: {
        studentId: student.id,
        subjectId,
        attendanceId: record.id,
        date: dayRange.start
      }
    })

    return res.status(201).json({
      message: `Attendance marked for ${student.user.name} in ${access.subject.name}.`,
      mode: 'SUBJECT',
      student: {
        id: student.id,
        name: student.user.name,
        rollNumber: student.rollNumber,
        semester: student.semester,
        section: student.section
      },
      subject: {
        id: access.subject.id,
        name: access.subject.name,
        code: access.subject.code
      },
      date: dayRange.start
    })
  } catch (error) {
    res.internalError(error)
  }
}

module.exports = {
  generateDailyAttendanceQR,
  getLiveGateAttendanceQr,
  generateQR,
  markAttendanceQR,
  markDailyAttendanceQR,
  markAttendanceManual,
  getAttendanceBySubject,
  getCoordinatorDepartmentAttendanceReport,
  exportCoordinatorDepartmentAttendanceReport,
  getMonthlyAttendanceReport,
  exportAttendanceBySubject,
  getMyAttendance,
  getSubjectRoster,
  getGateAttendanceSettings,
  createGateScanWindow,
  updateGateScanWindow,
  deleteGateScanWindow,
  createAttendanceHoliday,
  deleteAttendanceHoliday,
  scanStudentIdAttendance,
  getMyAbsenceTickets,
  createAbsenceTicket,
  getAbsenceTicketsForStaff,
  reviewAbsenceTicket
}


