const prisma = require('../utils/prisma')
const QRCode = require('qrcode')

// ================================
// GENERATE QR CODE (Instructor)
// ================================
const generateQR = async (req, res) => {
  try {
    const { subjectId } = req.body

    // Get instructor profile
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.user.id }
    })

    if (!instructor) {
      return res.status(403).json({ message: 'Only instructors can generate QR codes' })
    }

    // Check subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    })

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' })
    }

    // Create QR data with timestamp (valid for 10 minutes)
    const qrData = JSON.stringify({
      subjectId,
      instructorId: instructor.id,
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
      instructorId: instructor.id
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// MARK ATTENDANCE VIA QR (Student)
// ================================
const markAttendanceQR = async (req, res) => {
  try {
    const { qrData } = req.body

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(403).json({ message: 'Only students can mark attendance' })
    }

    // Parse QR data
    let parsedQR
    try {
      parsedQR = JSON.parse(qrData)
    } catch {
      return res.status(400).json({ message: 'Invalid QR code' })
    }

    // Check if QR is expired
    if (new Date() > new Date(parsedQR.expiresAt)) {
      return res.status(400).json({ message: 'QR code has expired' })
    }

    const { subjectId, instructorId } = parsedQR

    // Check if already marked today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        subjectId,
        date: { gte: today, lt: tomorrow }
      }
    })

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today' })
    }

    // Mark attendance
    const attendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        subjectId,
        instructorId,
        status: 'PRESENT',
        qrCode: qrData
      },
      include: {
        subject: { select: { name: true, code: true } },
        student: { include: { user: { select: { name: true } } } }
      }
    })

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

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// MARK ATTENDANCE MANUALLY (Instructor)
// ================================
const markAttendanceManual = async (req, res) => {
  try {
    const { subjectId, attendanceList } = req.body
    // attendanceList = [{ studentId, status }]

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.user.id }
    })

    if (!instructor) {
      return res.status(403).json({ message: 'Only instructors can mark attendance' })
    }

    // Check today's attendance already exists
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Create all attendance records
    const records = await Promise.all(
      attendanceList.map(async ({ studentId, status }) => {
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId,
            subjectId,
            date: { gte: today, lt: tomorrow }
          }
        })

        if (existing) {
          return prisma.attendance.update({
            where: { id: existing.id },
            data: { status }
          })
        }

        return prisma.attendance.create({
          data: {
            studentId,
            subjectId,
            instructorId: instructor.id,
            status
          }
        })
      })
    )

    res.status(201).json({
      message: 'Attendance marked successfully!',
      total: records.length,
      records
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// GET ATTENDANCE BY SUBJECT (Instructor)
// ================================
const getAttendanceBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params
    const { date } = req.query

    const filters = { subjectId }

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      filters.date = { gte: start, lte: end }
    }

    const attendance = await prisma.attendance.findMany({
      where: filters,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        subject: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    })

    res.json({ total: attendance.length, attendance })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// ================================
// GET MY ATTENDANCE (Student)
// ================================
const getMyAttendance = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(403).json({ message: 'Only students can view their attendance' })
    }

    const attendance = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        subject: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate percentage per subject
    const subjectMap = {}
    attendance.forEach(a => {
      const key = a.subject.name
      if (!subjectMap[key]) {
        subjectMap[key] = { total: 0, present: 0, subject: a.subject }
      }
      subjectMap[key].total++
      if (a.status === 'PRESENT') subjectMap[key].present++
    })

    const summary = Object.values(subjectMap).map(s => ({
      subject: s.subject.name,
      code: s.subject.code,
      total: s.total,
      present: s.present,
      percentage: ((s.present / s.total) * 100).toFixed(1) + '%'
    }))

    res.json({ attendance, summary })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = {
  generateQR,
  markAttendanceQR,
  markAttendanceManual,
  getAttendanceBySubject,
  getMyAttendance
}