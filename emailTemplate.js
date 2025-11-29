const generateEmailTemplate = (data) => {
  const {
    call_id,
    start_timestamp,
    duration_ms,
    transcript,
    recording_url,
    call_analysis,
    from_number
  } = data;

  const durationSeconds = duration_ms ? (duration_ms / 1000).toFixed(0) + 's' : '0s';
  const callDate = start_timestamp ? new Date(start_timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';

  const analysis = call_analysis || {};
  const customData = analysis.custom_analysis_data || {};
  const summary = analysis.call_summary || 'No summary generated.';
  const sentiment = analysis.user_sentiment || 'Neutral';

  // --- ROBUST DATA MAPPING ---
  // Helper to find keys like "Reason of Call", "reason_of_call", "ReasonOfCall"
  const getValue = (targetKey) => {
    const foundKey = Object.keys(customData).find(k => 
        k.toLowerCase().replace(/_/g, '').replace(/ /g, '') === targetKey.toLowerCase().replace(/_/g, '')
    );
    return { value: foundKey ? customData[foundKey] : null, actualKey: foundKey };
  };

  const guestNameObj = getValue('guestname');
  const reasonObj = getValue('reasonofcall');
  
  const guestName = guestNameObj.value || 'Unknown Guest';
  const reasonOfCall = reasonObj.value || 'General Inquiry';
  
  // Define sentiment color
  const sentimentColor = sentiment.toLowerCase().includes('positive') ? '#059669' : (sentiment.toLowerCase().includes('negative') ? '#DC2626' : '#4B5563');

  // Filter out the keys we already displayed (Guest Name and Reason) so they don't repeat at the bottom
  const usedKeys = [guestNameObj.actualKey, reasonObj.actualKey].filter(Boolean);
  
  const remainingFields = Object.keys(customData)
    .filter(k => !usedKeys.includes(k))
    .map(key => {
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

    /* Stats Grid */
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
        <td class="header"><h1>Call Summary</h1></td>
      </tr>
      <tr>
        <td class="content">
          
          <div class="hero-label">Reason for Call</div>
          <h2 class="hero-title">${reasonOfCall}</h2>
          <div class="guest-info">
             Accomodation: <strong style="color: #111827;">${guestName}</strong> <br>
             Phone: ${from_number}
          </div>

          <table class="stats-table">
            <tr>
              <td class="stat-box">
                <span class="stat-label">Duration</span>
                <span class="stat-value">${durationSeconds}</span>
              </td>
              <td class="stat-box">
                <span class="stat-label">Sentiment</span>
                <span class="stat-value" style="color: ${sentimentColor}">${sentiment}</span>
              </td>
              <td class="stat-box">
                <span class="stat-label">Date</span>
                <span class="stat-value">${callDate}</span>
              </td>
            </tr>
          </table>

          <div class="section-title">AI Summary</div>
          <div class="text-block">${summary}</div>

          ${remainingFields ? `
            <div class="section-title">Additional Details</div>
            <table style="width: 100%; border-collapse: collapse;">
                ${remainingFields}
            </table>
          ` : ''}


          <div class="section-title">Transcript</div>
          <div class="transcript-box">${transcript || 'No transcript text available.'}</div>
        </td>
      </tr>
    </table>
    <div class="footer"><p>Call ID: ${call_id}</p></div>
  </div>
</body>
</html>
  `;
};

module.exports = { generateEmailTemplate };