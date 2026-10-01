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
  const isConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
  if (!isConfigured) {
    console.warn(`${label} email skipped: SMTP is not configured.`);
    return false;
  }

  setImmediate(() => {
    sendEmail(message)
      .then((result) => {
        if (result.skipped) {
          console.warn(`${label} email skipped: SMTP is not configured.`);
        } else {
          console.info(`${label} email accepted by SMTP.`);
        }
      })
      .catch((error) => {
        console.error(`${label} email failed:`, error.code || 'UNKNOWN', error.responseCode || '');
      });
  });

  return true;
}

module.exports = { sendEmail, sendEmailInBackground };
