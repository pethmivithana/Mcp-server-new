// pages/api/send-email.js
import { sendEmail } from '../../email-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { to, subject, body, html } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ error: 'Missing "to" or "subject"' });
    }

    const info = await sendEmail({ to, subject, text: body, html });
    return res.status(200).json({ success: true, info });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
