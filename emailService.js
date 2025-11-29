const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    requireTls:true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Fail fast so we don't wait forever
    debug: true, // <--- This will print the SMTP handshake to your logs
    logger: true // <--- This will log the data
});

transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server is ready to take our messages');
    }
});

/**
 * Sends an email using the configured transporter.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML content of the email.
 * @returns {Promise} - Resolves with info on success.
 */
const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from:process.env.EMAIL_FROM, // Sender address
            to,
            subject,
            html,
            replyTo:process.env.EMAIL_FROM
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
