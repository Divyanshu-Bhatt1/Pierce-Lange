const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { sendEmail } = require('./emailService');
const { generateEmailTemplate } = require('./emailTemplate');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    // 1. Immediate Response to Retell AI
    // We send 200 OK immediately to prevent timeouts on their end.
    res.status(200).send('Webhook received');

    // 2. Asynchronous Processing
    try {

        
        const data = req.body;

         if (data.event !== 'call_analyzed') {
            console.log(`Ignoring event type: ${data.event}`);
            return;
        }

       
        console.log('Received webhook for Call ID:', data.call_id);

        // Basic Validation
        // if (!data.call_id) {
        //     console.error('Invalid payload: Missing call_id');
        //     return;
        // }

        const callData = data.call; 


        const customData = callData.call_analysis?.custom_analysis_data || {};

        const getValue = (targetKey) => {
            const foundKey = Object.keys(customData).find(k => 
                k.toLowerCase().replace(/_/g, '').replace(/ /g, '') === targetKey.toLowerCase().replace(/_/g, '')
            );
            return foundKey ? customData[foundKey] : null;
        };

        const guestName = getValue('guestname');
        const reason = getValue('reasonofcall');
        const phone = callData.from_number;

        // 2. CLEAN SUBJECT LINE LOGIC
        // Start with the phone number as a fallback
        let mainIdentity = phone;
        
        // If we have a name, use it instead of phone
        if (guestName && guestName !== 'Unknown') {
            mainIdentity = guestName;
        }

        let subject = `New Call: ${mainIdentity}`;

        // Only add the reason if it exists
        if (reason && reason !== 'Unknown') {
            subject += ` - ${reason}`;
        }
        


        // Generate Email Content
        const emailHtml = generateEmailTemplate(callData);
        // const subject = `Conversation with Ai Agent`;

        // Determine Recipient (In a real app, this might come from the database based on agent_id)
        // For now, we use a default or the one from env, or a hardcoded one for testing.
        // The user prompt said "To (recipient): e.g., the client’s email address".
        // We'll use a placeholder or an env var TARGET_EMAIL if it exists, otherwise log warning.
        const recipient = process.env.TARGET_EMAIL || 'client@example.com';

        if (recipient === 'client@example.com') {
            console.warn('Using default recipient: client@example.com. Configure TARGET_EMAIL in .env');
        }

        // Send Email
        await sendEmail(recipient, subject, emailHtml);
        console.log(`Email successfully sent to ${recipient} for Call ID: ${callData.call_id}`);

    } catch (error) {
        // Log errors but don't crash. Since we already sent 200, we can't send an error response.
        console.error('Error processing webhook asynchronously:', error);
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Retell AI Email Server is running.');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
