const https = require('https');
require('dotenv').config();

/**
 * Send an email via Resend's HTTP API.
 * 
 * Required env vars (set in Render dashboard):
 *   RESEND_API_KEY  - Your Resend API key (starts with "re_")
 *   EMAIL_FROM      - Sender address, e.g. "Splitra <no-reply@yourdomain.com>"
 *                     Note: must be from a verified domain in Resend.
 *                     For testing you can use: onboarding@resend.dev
 */
const sendEmail = async (to, subject, text) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const from = process.env.EMAIL_FROM || 'Splitra <onboarding@resend.dev>';

  const payload = JSON.stringify({
    from,
    to: [to],
    subject,
    text,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`📧 Email sent to ${to}: ${parsed.id || ''}`);
              resolve(parsed);
            } else {
              const errMsg = parsed.message || parsed.error || body;
              console.error(`❌ Resend API error (${res.statusCode}):`, errMsg);
              reject(new Error(`Resend API error: ${errMsg}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Resend response: ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('❌ Resend request failed:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = sendEmail;
