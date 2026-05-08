const base = (content) => `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff">
  <div style="background:#1A3C6E;padding:24px;color:#ffffff;font-size:22px;font-weight:bold">
    TriLearn
  </div>
  <div style="padding:32px 24px;font-size:15px;line-height:1.6;color:#1f2937">
    ${content}
  </div>
  <div style="background:#f9fafb;padding:16px 24px;font-size:12px;color:#6b7280">
    TriLearn · Nepal
  </div>
</div>`

const btn = (url, label) => (
  `<a href="${url}"
     style="display:inline-block;background:#F4A623;color:#1A3C6E;
            text-decoration:none;padding:12px 24px;border-radius:6px;
            font-weight:bold;margin:16px 0">${label}</a>`
)

const passwordResetTemplate = ({ name, resetUrl }) => ({
  subject: 'Reset your TriLearn password',
  html: base(`
    <p>Hi ${name},</p>
    <p>You requested a password reset. Click the button below.
       This link expires in <strong>30 minutes</strong>.</p>
    ${btn(resetUrl, 'Reset Password')}
    <p style="color:#6b7280;font-size:13px">
      If you didn't request this, ignore this email.
    </p>`),
  text: `Hi ${name},\n\nReset your password: ${resetUrl}\n\nExpires in 30 minutes.`
})

const welcomeTemplate = ({ name, email, tempPassword, verificationUrl }) => ({
  subject: 'Welcome to TriLearn - your account is ready',
  html: base(`
    <p>Hi ${name},</p>
    <p>Your TriLearn account has been created. Here are your login details:</p>
    <table style="border-collapse:collapse;width:100%;margin:12px 0">
      <tr><td style="padding:8px;color:#6b7280">Email</td>
          <td style="padding:8px;font-weight:600">${email}</td></tr>
      <tr style="background:#f8fafc">
          <td style="padding:8px;color:#6b7280">Password</td>
          <td style="padding:8px;font-weight:600">${tempPassword}</td></tr>
    </table>
    <p style="color:#dc2626;font-size:13px">
      You will be asked to change your password on first login.
    </p>
    ${verificationUrl
      ? `<p>Please verify your email address within <strong>24 hours</strong>.</p>${btn(verificationUrl, 'Verify Email')}`
      : ''}`),
  text: [
    `Hi ${name}`,
    '',
    `Email: ${email}`,
    `Password: ${tempPassword}`,
    '',
    'Change your password on first login.',
    ...(verificationUrl
      ? ['', `Verify your email within 24 hours: ${verificationUrl}`]
      : [])
  ].join('\n')
})

const emailVerificationTemplate = ({ name, verificationUrl }) => ({
  subject: 'Verify your TriLearn email',
  html: base(`
    <p>Hi ${name},</p>
    <p>Please verify your email address. This link expires in <strong>24 hours</strong>.</p>
    ${btn(verificationUrl, 'Verify Email')}
    <p style="color:#6b7280;font-size:13px">
      If you did not expect this email, ignore it.
    </p>`),
  text: `Hi ${name},\n\nVerify your email: ${verificationUrl}\n\nExpires in 24 hours.`
})

const noticeTemplate = ({ title, content, audience, type }) => ({
  subject: `[TriLearn Notice] ${title}`,
  html: base(`
    <span style="background:#f1f5f9;color:#475569;font-size:12px;
                 padding:3px 10px;border-radius:20px">${type}${audience ? ` - ${audience}` : ''}</span>
    <h3 style="margin:12px 0 6px">${title}</h3>
    <p style="color:#1f2937;line-height:1.6">${content}</p>`),
  text: `${title}\n\n${content}`
})

module.exports = {
  passwordResetTemplate,
  emailVerificationTemplate,
  welcomeTemplate,
  noticeTemplate
}
