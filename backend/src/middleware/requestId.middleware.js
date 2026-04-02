const { randomUUID } = require('crypto')

const requestId = (req, res, next) => {
  req.id = randomUUID()
  res.setHeader('X-Request-ID', req.id)
  next()
}

module.exports = {
  requestId
}
