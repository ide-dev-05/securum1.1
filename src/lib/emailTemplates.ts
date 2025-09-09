type TemplateInput = {
  code: string
  minutes?: number
  brandName?: string
}

function baseStyles() {
  return {
    background: '#0f172a', // slate-900 header
    border: '#e5e7eb', // gray-200
    text: '#0f172a', // slate-900
    muted: '#6b7280', // gray-500
    primary: '#0891b2', // cyan-700
    cardBg: '#ffffff',
  }
}

function layoutHtml(opts: {
  title: string
  intro: string
  code: string
  minutes: number
  brandName: string
  actionHint?: string
}) {
  const s = baseStyles()
  const { title, intro, code, minutes, brandName, actionHint } = opts
  const preview = `${title} • ${brandName}`

  // Inline-friendly HTML email
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(preview)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${s.text}">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:92%;">
              <tr>
                <td style="background:${s.background};color:#fff;border-radius:12px 12px 0 0;padding:20px 24px;text-align:center;font-weight:700;font-size:18px;letter-spacing:0.3px">
                  ${escapeHtml(brandName)}
                </td>
              </tr>
              <tr>
                <td style="background:${s.cardBg};border:1px solid ${s.border};border-top:0;border-radius:0 0 12px 12px;padding:24px 24px 8px;">
                  <h1 style="margin:0 0 12px 0;font-size:22px;color:${s.text}">${escapeHtml(title)}</h1>
                  <p style="margin:0 0 12px 0;color:${s.muted};line-height:1.55">${escapeHtml(intro)}</p>
                  <div style="margin:20px 0 6px 0;text-align:center">
                    <div style="display:inline-block;background:#0b1220;color:#e2e8f0;padding:14px 18px;border-radius:10px;font-weight:700;font-size:22px;letter-spacing:6px">${escapeHtml(code)}</div>
                  </div>
                  <p style="margin:8px 0 16px 0;color:${s.muted};font-size:14px;text-align:center">This code expires in ${minutes} minutes.</p>
                  ${actionHint ? `<p style="margin:12px 0 16px 0;color:${s.muted};font-size:14px;text-align:center">${escapeHtml(actionHint)}</p>` : ''}
                  <hr style="border:none;border-top:1px solid ${s.border};margin:20px 0" />
                  <p style="margin:0 0 8px 0;font-size:13px;color:${s.muted};text-align:center">If you did not request this, you can ignore this email.</p>
                  <p style="margin:0 0 16px 0;font-size:13px;color:${s.muted};text-align:center">This is Securum Cybersecurity AI</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

function textFallback(opts: { title: string; intro: string; code: string; minutes: number; brandName: string; actionHint?: string }) {
  const { title, intro, code, minutes, brandName, actionHint } = opts
  return `${brandName}\n\n${title}\n\n${intro}\n\nCODE: ${code}\nExpires in ${minutes} minutes.${actionHint ? `\n\n${actionHint}` : ''}\n\nIf you did not request this, you can ignore this email.\n\nThis is Securum Cybersecurity AI`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function verificationEmail(input: TemplateInput) {
  const minutes = input.minutes ?? 15
  const brandName = input.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Securum Cybersecurity AI'
  const title = 'Confirm your account'
  const intro = 'Use the verification code below to finish creating your account.'
  const actionHint = 'Enter this code on the verification screen to continue.'
  const html = layoutHtml({ title, intro, code: input.code, minutes, brandName, actionHint })
  const text = textFallback({ title, intro, code: input.code, minutes, brandName, actionHint })
  const subject = `${title}`
  return { subject, text, html }
}

export function resetCodeEmail(input: TemplateInput) {
  const minutes = input.minutes ?? 10
  const brandName = input.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Securum Cybersecurity AI'
  const title = 'Reset your password'
  const intro = 'Use the password reset code below to continue.'
  const actionHint = 'Enter this code in the app to reset your password.'
  const html = layoutHtml({ title, intro, code: input.code, minutes, brandName, actionHint })
  const text = textFallback({ title, intro, code: input.code, minutes, brandName, actionHint })
  const subject = `${title}`
  return { subject, text, html }
}

export function genericCodeEmail(input: { code: string; title: string; intro: string; minutes?: number; brandName?: string; actionHint?: string }) {
  const minutes = input.minutes ?? 10
  const brandName = input.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Securum Cybersecurity AI'
  const html = layoutHtml({ title: input.title, intro: input.intro, code: input.code, minutes, brandName, actionHint: input.actionHint })
  const text = textFallback({ title: input.title, intro: input.intro, code: input.code, minutes, brandName, actionHint: input.actionHint })
  const subject = input.title
  return { subject, text, html }
}

export function loginAlertEmail(input: { datetime: string; device?: string; ip?: string; location?: string; brandName?: string }) {
  const s = baseStyles()
  const brandName = input.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Securum Cybersecurity AI'
  const title = 'New login to your account'
  const intro = 'We noticed a new sign-in to your account.'
  const detailsRows = [
    { label: 'Date & Time', value: input.datetime },
    { label: 'Device', value: input.device || 'Unknown' },
    { label: 'IP Address', value: input.ip || 'Unknown' },
    { label: 'Location', value: input.location || 'Unknown' },
  ]
  const detailsHtml = detailsRows.map(r => (
    `<tr>
      <td style="padding:8px 12px;color:${s.muted};font-size:14px;width:140px">${escapeHtml(r.label)}</td>
      <td style="padding:8px 12px;color:${s.text};font-size:14px;font-weight:600">${escapeHtml(r.value)}</td>
    </tr>`
  )).join('')
  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)} • ${escapeHtml(brandName)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${s.text}">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:92%;">
              <tr>
                <td style="background:${s.background};color:#fff;border-radius:12px 12px 0 0;padding:20px 24px;text-align:center;font-weight:700;font-size:18px;letter-spacing:0.3px">
                  ${escapeHtml(brandName)}
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border:1px solid ${s.border};border-top:0;border-radius:0 0 12px 12px;padding:24px 24px 8px;">
                  <h1 style="margin:0 0 12px 0;font-size:22px;color:${s.text}">${escapeHtml(title)}</h1>
                  <p style="margin:0 0 16px 0;color:${s.muted};line-height:1.55">${escapeHtml(intro)}</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;background:#f9fafb;border:1px solid ${s.border};border-radius:10px">
                    ${detailsHtml}
                  </table>
                  <hr style="border:none;border-top:1px solid ${s.border};margin:20px 0" />
                  <p style="margin:0 0 8px 0;font-size:13px;color:${s.muted};text-align:center">If this wasn't you, secure your account immediately by resetting your password.</p>
                  <p style="margin:0 0 16px 0;font-size:13px;color:${s.muted};text-align:center">This is Securum Cybersecurity AI</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
  const text = `${brandName}\n\nNew login to your account\n\nDate & Time: ${input.datetime}\nDevice: ${input.device || 'Unknown'}\nIP Address: ${input.ip || 'Unknown'}\nLocation: ${input.location || 'Unknown'}\n\nIf this wasn't you, please reset your password.`
  const subject = 'New login to your account'
  return { subject, text, html }
}
