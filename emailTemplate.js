// emailTemplate.js
const generateEmailTemplate = (data, userPhone) => {
  const {
    call_id,
    start_timestamp,
    duration_ms,
    transcript,
    call_analysis
  } = data;

  // German Date/Time Formats
  const durationSeconds = duration_ms ? (duration_ms / 1000).toFixed(0) + 's' : '0s';
  const callDate = start_timestamp ? new Date(start_timestamp).toLocaleString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Gerade eben';

  const analysis = call_analysis || {};
  const customData = analysis.custom_analysis_data || {};
  
  // NOTE: The values here (summary, sentiment, reasons) will be passed in German from server.js
  const summary = analysis.call_summary || 'Keine Zusammenfassung.';
  const sentiment = analysis.user_sentiment || 'Neutral';

  // --- DATA MAPPING ---
  const getValue = (targetKey) => {
    const foundKey = Object.keys(customData).find(k => 
        k.toLowerCase().replace(/_/g, '').replace(/ /g, '') === targetKey.toLowerCase().replace(/_/g, '')
    );
    return { value: foundKey ? customData[foundKey] : null, actualKey: foundKey };
  };

  const guestNameObj = getValue('accommodationname');
  const reasonObj = getValue('reasonofcall');
  
  const guestName = guestNameObj.value || 'Unbekannter Gast';
  const reasonOfCall = reasonObj.value || 'Allgemeine Anfrage';
  
  const sentimentColor = sentiment.toLowerCase().includes('positive') ? '#059669' : (sentiment.toLowerCase().includes('negative') ? '#DC2626' : '#4B5563');

  // Filter out Guest Name and Reason so they don't appear in "Additional Details"
  const usedKeys = [guestNameObj.actualKey, reasonObj.actualKey].filter(Boolean);
  
  const remainingFields = Object.keys(customData)
    .filter(k => !usedKeys.includes(k))
    .map(key => {
        // Format Key: "appointment_time" -> "Appointment Time"
        let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
        <tr>
            <td style="padding: 10px 0; color: #6B7280; font-size: 14px; width: 40%; border-bottom: 1px solid #f3f4f6;">${label}</td>
            <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 500; border-bottom: 1px solid #f3f4f6;">${customData[key]}</td>
        </tr>`;
    }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F3F4F6; padding-bottom: 40px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #E5E7EB; }
    .header { background-color: #2D3748; padding: 24px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
    .content { padding: 32px; }
    .hero-label { font-size: 12px; text-transform: uppercase; color: #6B7280; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px; }
    .hero-title { font-size: 26px; color: #111827; margin: 0 0 10px 0; font-weight: 800; line-height: 1.2; }
    .guest-info { font-size: 15px; color: #4B5563; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #E5E7EB; }
    .stats-table { width: 100%; margin-bottom: 25px; }
    .stat-box { text-align: center; padding: 10px; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .stat-value { font-size: 16px; font-weight: 600; color: #1F2937; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #374151; margin-top: 25px; margin-bottom: 10px; letter-spacing: 0.5px; }
    .text-block { background-color: #F9FAFB; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.6; color: #374151; border: 1px solid #E5E7EB; }
    .transcript-box { font-size: 13px; color: #6B7280; line-height: 1.6; max-height: 200px; overflow-y: auto; white-space: pre-wrap; padding: 10px; background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; }
    .footer { text-align: center; font-size: 12px; color: #9CA3AF; padding: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <br>
    <table class="main-table" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header"><h1>Anruf Zusammenfassung</h1></td>
      </tr>
      <tr>
        <td class="content">
          
          <div class="hero-label">Grund des Anrufs</div>
          <h2 class="hero-title">${reasonOfCall}</h2>
          <div class="guest-info">
             Unterkunft: <strong style="color: #111827;">${guestName}</strong> <br>
             Telefon: ${userPhone}
          </div>

          <table class="stats-table">
            <tr>
              <td class="stat-box">
                <span class="stat-label">Dauer</span>
                <span class="stat-value">${durationSeconds}</span>
              </td>
              <td class="stat-box">
                <span class="stat-label">Stimmung</span>
                <span class="stat-value" style="color: ${sentimentColor}">${sentiment}</span>
              </td>
              <td class="stat-box">
                <span class="stat-label">Datum</span>
                <span class="stat-value">${callDate}</span>
              </td>
            </tr>
          </table>

          <div class="section-title">KI Zusammenfassung</div>
          <div class="text-block">${summary}</div>

          ${remainingFields ? `
            <div class="section-title">Weitere Details</div>
            <table style="width: 100%; border-collapse: collapse;">
                ${remainingFields}
            </table>
          ` : ''}

          <div class="section-title">Transkript</div>
          <div class="transcript-box">${transcript || 'Kein Transkript verfügbar.'}</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

module.exports = { generateEmailTemplate };