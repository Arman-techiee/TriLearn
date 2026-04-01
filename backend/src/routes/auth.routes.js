const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const { authLimiter } = require('../middleware/rateLimit.middleware')

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', protect, getMe)

module.exports = router
