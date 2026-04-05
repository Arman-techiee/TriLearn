const nodemailer = require('nodemailer')
const logger = require('./logger')

const createTransport = () => nodemailer.createTransport({
  host: process.env.RESEND_SMTP_HOST,
  port: Number(process.env.RESEND_SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.RESEND_SMTP_USER,
    pass: process.env.RESEND_SMTP_PASS
  }
})

const sendMail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_SMTP_PASS) {
    logger.warn('Email not sent - RESEND_SMTP_PASS not configured')
    return
  }

  const transporter = createTransport()

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'TriLearn <no-reply@trilearn.app>',
    to,
    subject,
    html,
    text
  })
}

module.exports = { sendMail }
