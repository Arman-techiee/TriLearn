const path = require('path')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const { uploadPath, uploadPublicPath } = require('../utils/fileStorage')
const { getTrustedOrigins } = require('../middleware/csrf.middleware')

const buildRelativeUploadPath = (fileName) => `${uploadPublicPath}/${fileName}`

const getAccessSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured')
  }

  return process.env.JWT_SECRET
}

const getAuthenticatedUser = async (req) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return null
  }

  const decoded = jwt.verify(token, getAccessSecret())
  if (decoded?.type !== 'access') {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id,
      deletedAt: null
    },
    select: {
      id: true,
      role: true,
      isActive: true,
      student: {
        select: {
          id: true
        }
      },
      instructor: {
        select: {
          id: true
        }
      },
      coordinator: {
        select: {
          id: true
        }
      }
    }
  })

  return user?.isActive ? user : null
}

const setUploadSecurityHeaders = (res) => {
  const allowedFrameAncestors = ["'self'"]
  const trustedOrigins = getTrustedOrigins()

  trustedOrigins.forEach((origin) => {
    if (origin && !allowedFrameAncestors.includes(origin)) {
      allowedFrameAncestors.push(origin)
    }
  })

  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader('Content-Security-Policy', `default-src 'none'; frame-ancestors ${allowedFrameAncestors.join(' ')}; sandbox allow-downloads`)
}

const sendUploadFile = (res, fileName) => {
  setUploadSecurityHeaders(res)
  res.sendFile(path.join(uploadPath, fileName), {
    headers: {
      'Cache-Control': 'private, no-store'
    }
  })
}

const isStudentEnrolledInSubject = async (studentId, subjectId) => {
  const enrollment = await prisma.subjectEnrollment.findUnique({
    where: {
      subjectId_studentId: {
        subjectId,
        studentId
      }
    },
    select: {
      id: true
    }
  })

  return Boolean(enrollment)
}

const canAccessAssignmentFile = async (user, assignment) => {
  if (!user) {
    return false
  }

  if (['ADMIN', 'COORDINATOR'].includes(user.role)) {
    return true
  }

  if (user.role === 'INSTRUCTOR') {
    return assignment.instructorId === user.instructor?.id
  }

  if (user.role === 'STUDENT' && user.student?.id) {
    return isStudentEnrolledInSubject(user.student.id, assignment.subjectId)
  }

  return false
}

const canAccessSubmissionFile = async (user, submission) => {
  if (!user) {
    return false
  }

  if (['ADMIN', 'COORDINATOR'].includes(user.role)) {
    return true
  }

  if (user.role === 'INSTRUCTOR') {
    return submission.assignment.instructorId === user.instructor?.id
  }

  if (user.role === 'STUDENT') {
    return submission.studentId === user.student?.id
  }

  return false
}

const canAccessMaterialFile = async (user, material) => {
  if (!user) {
    return false
  }

  if (['ADMIN', 'COORDINATOR'].includes(user.role)) {
    return true
  }

  if (user.role === 'INSTRUCTOR') {
    return material.instructorId === user.instructor?.id
  }

  if (user.role === 'STUDENT' && user.student?.id) {
    return isStudentEnrolledInSubject(user.student.id, material.subjectId)
  }

  return false
}

const serveUploadedFile = async (req, res) => {
  try {
    const fileName = path.basename(String(req.params.filename || ''))
    if (!fileName) {
      return res.status(404).json({ message: 'File not found' })
    }

    const relativePath = buildRelativeUploadPath(fileName)

    const avatar = await prisma.user.findFirst({
      where: { avatar: relativePath },
      select: { id: true }
    })

    if (avatar) {
      return sendUploadFile(res, fileName)
    }

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return res.status(401).json({ message: 'No token, access denied' })
    }

    const assignment = await prisma.assignment.findFirst({
      where: { questionPdfUrl: relativePath },
      select: {
        id: true,
        subjectId: true,
        instructorId: true
      }
    })

    if (assignment) {
      if (!(await canAccessAssignmentFile(user, assignment))) {
        return res.status(403).json({ message: 'Access denied' })
      }

      return sendUploadFile(res, fileName)
    }

    const submission = await prisma.submission.findFirst({
      where: { fileUrl: relativePath },
      select: {
        id: true,
        studentId: true,
        assignment: {
          select: {
            instructorId: true
          }
        }
      }
    })

    if (submission) {
      if (!(await canAccessSubmissionFile(user, submission))) {
        return res.status(403).json({ message: 'Access denied' })
      }

      return sendUploadFile(res, fileName)
    }

    const material = await prisma.studyMaterial.findFirst({
      where: { fileUrl: relativePath },
      select: {
        id: true,
        subjectId: true,
        instructorId: true
      }
    })

    if (material) {
      if (!(await canAccessMaterialFile(user, material))) {
        return res.status(403).json({ message: 'Access denied' })
      }

      return sendUploadFile(res, fileName)
    }

    return res.status(404).json({ message: 'File not found' })
  } catch (error) {
    return res.internalError
      ? res.internalError(error)
      : res.status(500).json({ message: 'Something went wrong' })
  }
}

module.exports = {
  serveUploadedFile
}
