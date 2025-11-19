const nodemailer = require('nodemailer');
require('dotenv').config();

// Nodemailer-only configuration using SMTP credentials supplied via env vars.
// Set these env vars in your Render/hosting dashboard:
// EMAIL_HOST (default: smtp.gmail.com)
// EMAIL_PORT (default: 587)
// EMAIL_SECURE ("true" or "false", default: false)
// EMAIL_USER
// EMAIL_PASS
// EMAIL_FROM (optional, default: 'Splitra <no-reply@splitra.app>')

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

// Verify transporter at startup so SMTP/network/auth errors appear in logs early
transporter.verify()
  .then(() => console.log('📧 Mailer: SMTP connection verified'))
  .catch((err) => console.error('❌ Mailer verify failed:', err && err.message ? err.message : err));

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Splitra <no-reply@splitra.app>',
      to,
      subject,
      text
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId || ''}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error && error.message ? error.message : error);
    // Rethrow so caller can handle the failure (e.g., return 500 or fallback)
    throw error;
  }
};

module.exports = sendEmail;
