// emailService.js
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid with the API Key
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.error('❌ FATAL: SENDGRID_API_KEY is missing in .env file');
}

/**
 * Sends an email using the SendGrid Web API.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML content of the email.
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html) => {
    // 1. Validation Edge Cases
    if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ Cannot send email: SendGrid API Key is missing.');
        return;
    }

    if (!process.env.EMAIL_FROM) {
        console.error('❌ Cannot send email: EMAIL_FROM is missing in .env.');
        return;
    }

    if (!to) {
        console.error('❌ Cannot send email: Recipient address is missing.');
        return;
    }

    // 2. Prepare the Message Object
    const msg = {
        to: to, // Recipient
        from: {
            email: process.env.EMAIL_FROM, // app@entlastet.com
            name: 'entlastet app'          // <--- THIS IS THE CHANGE
        },
        subject: subject,
        html: html,
    };

    // 3. Attempt to Send
    try {
        const response = await sgMail.send(msg);
        
        // Response is an array, index 0 contains the statusCode
        const statusCode = response[0].statusCode;
        
        if (statusCode === 200 || statusCode === 202) {
            console.log(`✅ Email successfully sent via SendGrid to ${to}`);
            return response;
        } else {
            console.warn(`⚠️ Email sent but received unexpected status code: ${statusCode}`);
        }

    } catch (error) {
        // 4. Robust Error Handling
        console.error('❌ Error sending email via SendGrid:');

        if (error.response) {
            // SendGrid specific API errors (The most useful part for debugging)
            console.error(`Status Code: ${error.code}`);
            console.error('SendGrid Error Body:', JSON.stringify(error.response.body, null, 2));
        } else {
            // General Network or Code errors
            console.error(error.message);
        }
        
        // We throw the error so server.js is aware (though server.js catches it silently)
        throw error; 
    }
};

module.exports = { sendEmail };