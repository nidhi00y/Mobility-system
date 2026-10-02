const nodemailer = require('nodemailer');
const emailPort = Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function getSenderAddress() {
  const authenticatedAddress = (process.env.EMAIL_USER || '').trim();
  const configuredFrom = (process.env.EMAIL_FROM || '').trim();
  const match = configuredFrom.match(/<([^>]+)>/);
  const configuredAddress = (match ? match[1] : configuredFrom).trim();

  if (configuredAddress && configuredAddress.toLowerCase() === authenticatedAddress.toLowerCase()) {
    return configuredFrom;
  }

  return authenticatedAddress;
}

async function sendEmail({ to, subject, text }) {
  if (process.env.RESEND_API_KEY) {
    const from = (process.env.EMAIL_FROM || '').trim();
    if (!from) {
      throw new Error('EMAIL_FROM is required when RESEND_API_KEY is configured.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });

    if (!response.ok) {
      const error = new Error('Resend rejected the email request.');
      error.code = `RESEND_${response.status}`;
      throw error;
    }

    return { ok: true, skipped: false, accepted: 1, provider: 'Resend' };
  }

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return { ok: true, skipped: true };
  }

  const result = await transporter.sendMail({
    from: getSenderAddress(),
    to,
    subject,
    text,
  });

  if (Array.isArray(result.accepted) && result.accepted.length === 0) {
    throw new Error('SMTP server did not accept the recipient.');
  }

  return { ok: true, skipped: false, accepted: result.accepted?.length ?? 1 };
}

function sendEmailInBackground(message, label = 'Notification') {
  const isConfigured = process.env.RESEND_API_KEY
    ? Boolean(process.env.EMAIL_FROM)
    : Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  if (!isConfigured) {
    console.warn(`${label} email skipped: SMTP is not configured.`);
    return false;
  }

  setImmediate(() => {
    sendEmail(message)
      .then((result) => {
        if (result.skipped) {
          console.warn(`${label} email skipped: no email provider is configured.`);
        } else {
          console.info(`${label} email accepted by ${result.provider || 'SMTP'}.`);
        }
      })
      .catch((error) => {
        console.error(`${label} email failed:`, error.code || 'UNKNOWN', error.responseCode || '');
      });
  });

  return true;
}

module.exports = { sendEmail, sendEmailInBackground };
