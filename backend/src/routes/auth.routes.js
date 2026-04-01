const express = require('express')
const router = express.Router()
const { register, login, refresh, logout, getMe } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const { authLimiter } = require('../middleware/rateLimit.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')

router.post('/register', authLimiter, validate(schemas.auth.register), register)
router.post('/login', authLimiter, validate(schemas.auth.login), login)
router.post('/refresh', authLimiter, refresh)
router.post('/logout', logout)
router.get('/me', protect, getMe)

module.exports = router
