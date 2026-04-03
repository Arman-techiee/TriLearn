module.exports = {
  ...require('./attendance/attendance.controller'),
  ...require('./attendance/export.controller'),
  ...require('./attendance/qr.controller'),
  ...require('./attendance/tickets.controller'),
  ...require('./attendance/settings.controller')
}
