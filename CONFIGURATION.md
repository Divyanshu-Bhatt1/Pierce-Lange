# Retell AI Email Server Configuration

## 1. Environment Setup

1.  **Install Node.js**: Ensure Node.js is installed on your machine.
2.  **Install Dependencies**:
    Run the following command in the project directory:
    ```bash
    npm install
    ```

## 2. Configuration (.env)

Open the `.env` file and update the following values:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=max@entlastet.com
SMTP_PASS=your_app_password_here  <-- IMPORTANT: Use an App Password, not your login password.
EMAIL_FROM=app@entlastet.com
TARGET_EMAIL=client@example.com   <-- The email address where call summaries will be sent.
```

### How to get a Gmail App Password:
1.  Go to your Google Account settings.
2.  Navigate to **Security**.
3.  Under "Signing in to Google," enable **2-Step Verification** if not already enabled.
4.  Search for **App passwords**.
5.  Create a new app password (name it "Retell Server") and copy the 16-character code into `SMTP_PASS`.

## 3. Running the Server

Start the server with:
```bash
node server.js
```

The server will run on `http://localhost:3000`.

## 4. Testing with cURL

You can simulate a Retell AI webhook using the following command. Open a new terminal (Command Prompt or PowerShell) and run:

### PowerShell
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = '{
  "call_id": "call_123456789",
  "agent_id": "agent_abc123",
  "call_status": "ended",
  "start_timestamp": 1701234567000,
  "end_timestamp": 1701234687000,
  "duration_ms": 120000,
  "transcript": "Agent: Hello, how can I help you?\nUser: I would like to book a room.\nAgent: Sure, for which dates?",
  "recording_url": "https://example.com/recording.mp3",
  "public_log_url": "https://example.com/log",
  "call_analysis": {
    "call_summary": "User wanted to book a room.",
    "user_sentiment": "Positive",
    "call_successful": true
  }
}'
Invoke-RestMethod -Uri "http://localhost:3000/webhook" -Method Post -Headers $headers -Body $body
```

### Command Prompt (cmd)
```cmd
curl -X POST http://localhost:3000/webhook ^
-H "Content-Type: application/json" ^
-d "{\"call_id\": \"call_123456789\", \"agent_id\": \"agent_abc123\", \"call_status\": \"ended\", \"start_timestamp\": 1701234567000, \"end_timestamp\": 1701234687000, \"duration_ms\": 120000, \"transcript\": \"Agent: Hello...\", \"recording_url\": \"https://example.com/recording.mp3\", \"call_analysis\": {\"call_summary\": \"Test summary\", \"user_sentiment\": \"Positive\", \"call_successful\": true}}"
```

## 5. Deployment
To expose this local server to the internet (so Retell AI can reach it), use **ngrok**:
1.  Install ngrok.
2.  Run `ngrok http 3000`.
3.  Copy the HTTPS URL (e.g., `https://xyz.ngrok-free.app`).
4.  Paste this URL + `/webhook` (e.g., `https://xyz.ngrok-free.app/webhook`) into your Retell AI Agent's "Post Call Webhook URL" setting.
