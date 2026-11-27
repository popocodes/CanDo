// Email through any SMTP provider. Settings come from .env (see SETUP.md).
const nodemailer = require('nodemailer');

const configured = () => !!(process.env.SMTP_HOST && process.env.SMTP_FROM);

async function send(to, subject, text) {
  if (!configured()) throw new Error('Email is not set up on this server');
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465 && process.env.SMTP_ALLOW_PLAIN !== '1',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10000
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

module.exports = { configured, send };
