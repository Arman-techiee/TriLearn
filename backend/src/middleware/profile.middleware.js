const attachActorProfiles = async (req, _res, next) => {
  if (!req.user?.id || !req.user?.role) {
    return next()
  }

  try {
    if (req.user.role === 'INSTRUCTOR') {
      req.instructor = req.user.instructor || null
    } else if (req.user.role === 'STUDENT') {
      req.student = req.user.student || null
    } else if (req.user.role === 'COORDINATOR') {
      req.coordinator = req.user.coordinator || null
    } else if (req.user.role === 'GATEKEEPER') {
      req.gatekeeper = { userId: req.user.id }
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  attachActorProfiles
}
