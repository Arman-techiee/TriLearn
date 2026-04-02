const prisma = require('../utils/prisma')

const attachActorProfiles = async (req, _res, next) => {
  if (!req.user?.id || !req.user?.role) {
    return next()
  }

  try {
    if (req.user.role === 'INSTRUCTOR') {
      req.instructor = await prisma.instructor.findUnique({
        where: { userId: req.user.id }
      })
    }

    if (req.user.role === 'STUDENT') {
      req.student = await prisma.student.findUnique({
        where: { userId: req.user.id }
      })
    }

    if (req.user.role === 'COORDINATOR') {
      req.coordinator = await prisma.coordinator.findUnique({
        where: { userId: req.user.id }
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  attachActorProfiles
}
