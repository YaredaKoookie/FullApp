const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: `"HealthConnect Admin" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};