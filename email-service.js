// email-service.js
import nodemailer from 'nodemailer';


export function createTransportFromEnv(env = process.env) {
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
throw new Error('Missing SMTP_* env vars');
}
return nodemailer.createTransport({
host: SMTP_HOST,
port: Number(SMTP_PORT),
secure: Number(SMTP_PORT) === 465,
auth: { user: SMTP_USER, pass: SMTP_PASS }
});
}


export async function sendEmail({ to, subject, text, html }, env = process.env) {
const transporter = createTransportFromEnv(env);
const from = env.FROM_EMAIL || 'no-reply@example.com';
const info = await transporter.sendMail({ from, to, subject, text, html });
return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}