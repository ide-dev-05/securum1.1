import nodemailer from 'nodemailer'

const port = Number(process.env.MAIL_PORT || 587)
const secure = port === 465

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port,
  secure, // true for 465, false for 587/2525
  auth: process.env.MAIL_USER && process.env.MAIL_PASS ? {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  } : undefined,
  tls: {
    // allow self-signed in dev
    rejectUnauthorized: false,
  },
})

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  // If mail is not configured, log and return a mock response
  if (!process.env.MAIL_HOST || !process.env.MAIL_FROM) {
    console.warn('[mail] MAIL_HOST/MAIL_FROM not set; skipping real send')
    console.info(`[mail] to=${to} subject=${subject} text=${text}`)
    return { mock: true }
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  })
  return info
}

export default transporter
