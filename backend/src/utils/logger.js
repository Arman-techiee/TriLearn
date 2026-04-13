const fs = require('fs')
const path = require('path')
const winston = require('winston')

const logsDir = path.join(__dirname, '..', '..', 'logs')
const isProduction = process.env.NODE_ENV === 'production'

if (!isProduction) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const transports = [
  new winston.transports.Console()
]

if (!isProduction) {
  transports.push(
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' })
  )
}

const logger = winston.createLogger({
  level: isProduction ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
})

module.exports = logger
