const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { schemas } = require('../validators/schemas')
const {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  registerDeviceToken,
  unregisterDeviceToken
} = require('../controllers/notification.controller')

router.use(protect)

router.get('/', listNotifications)
router.get('/unread-count', getUnreadNotificationCount)
router.post('/device-token', validate(schemas.notifications.registerDeviceToken), registerDeviceToken)
router.delete('/device-token', validate(schemas.notifications.unregisterDeviceToken), unregisterDeviceToken)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)

module.exports = router
