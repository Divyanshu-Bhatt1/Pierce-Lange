const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { sendEmail } = require('./emailService');
const { generateEmailTemplate } = require('./emailTemplate');
const translate = require('google-translate-api-x'); // Lib for translation

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// --- 🛠️ HELPER: Auto-Translate Object to German ---
const translateDataToGerman = async (callData) => {
    // 1. Create a deep copy so we don't mess up original data
    const germanData = JSON.parse(JSON.stringify(callData));
    const analysis = germanData.call_analysis || {};
    const customData = analysis.custom_analysis_data || {};

    // 2. Prepare list of things to translate
    // We want Summary, Sentiment, and ALL values inside custom_analysis_data
    const textsToTranslate = [];
    
    if (analysis.call_summary) textsToTranslate.push({ obj: analysis, key: 'call_summary' });
    if (analysis.user_sentiment) textsToTranslate.push({ obj: analysis, key: 'user_sentiment' });
    
    // Automatically add every value in Custom Data (Reason, Guest Name, etc.)
    Object.keys(customData).forEach(key => {
        if (typeof customData[key] === 'string') {
            textsToTranslate.push({ obj: customData, key: key });
        }
    });

    // 3. Execute Translations in Parallel
    try {
        const promises = textsToTranslate.map(async (item) => {
            // Translate to German ('de')
            const result = await translate(item.obj[item.key], { to: 'de' });
            item.obj[item.key] = result.text; // Update the object directly
        });
        await Promise.all(promises);
    } catch (e) {
        console.error('Translation Error:', e.message);
        // If translation fails, we keep the original English text
    }

    return germanData;
};

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    // 1. Immediate Response to Retell AI
    res.status(200).send('Webhook received');

    // 2. Asynchronous Processing
    try {
        const data = req.body;

         if (data.event !== 'call_analyzed') {
            console.log(`Ignoring event type: ${data.event}`);
            return;
        }

        console.log('Received webhook for Call ID:', data.call_id);
        const callData = data.call; 

        // --- SMART PHONE NUMBER LOGIC ---
        const direction = callData.direction; // 'inbound' or 'outbound'
        let userPhone = '';

        if (direction === 'inbound') {
            userPhone = callData.from_number;
        } else {
            userPhone = callData.to_number;
        }

        console.log(`📞 Call Direction: ${direction}`);
        console.log(`👤 Customer Number extracted: ${userPhone}`);

        console.log("data object =>",data.direction," ",data.to_number," ",data.from_number);


        // --- 🔥 TRANSLATION START 🔥 ---
        console.log('🇩🇪 Translating data to German...');
        
        // This function converts Summary, Sentiment, Reason, GuestName, etc. into German
        const germanCallData = await translateDataToGerman(callData);
        
        // We now extract data from the TRANSLATED object
        const customData = germanCallData.call_analysis?.custom_analysis_data || {};

        const getValue = (targetKey) => {
            const foundKey = Object.keys(customData).find(k => 
                k.toLowerCase().replace(/_/g, '').replace(/ /g, '') === targetKey.toLowerCase().replace(/_/g, '')
            );
            return foundKey ? customData[foundKey] : null;
        };

        const guestName = getValue('accommodationname');
        const reason = getValue('reasonofcall');


        // --- SUBJECT LINE LOGIC (GERMAN) ---
        let mainIdentity = userPhone;
        
        // If we have a name, use it instead of phone
        if (guestName && guestName !== 'Unknown' && guestName !== 'Unbekannt') {
            mainIdentity = guestName;
        }

        // "Neuer Anruf" = New Call
        let subject = `Neuer Anruf: ${mainIdentity}`;

        // Only add the reason if it exists
        if (reason && reason !== 'Unknown') {
            subject += ` - ${reason}`;
        }
        
        // --- GENERATE & SEND ---
        // Pass the TRANSLATED data to the template
        const emailHtml = generateEmailTemplate(germanCallData, userPhone);

        const recipient = process.env.TARGET_EMAIL || 'client@example.com';

        if (recipient === 'client@example.com') {
            console.warn('Using default recipient: client@example.com. Configure TARGET_EMAIL in .env');
        }

        // Send Email (Uncommented so it works)
        await sendEmail(recipient, subject, emailHtml);
        console.log(`Email successfully sent to ${recipient} for Call ID: ${callData.call_id}`);

    } catch (error) {
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