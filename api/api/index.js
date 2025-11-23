const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Get environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Store tokens temporarily (in production, use a database)
const tokens = {};

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <h1>Job Tracker Backend</h1>
    <p>Backend is running! ✅</p>
    <p>Use the extension to authenticate.</p>
  `);
});

// Step 1: Generate auth URL
app.get('/auth/url', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/script.projects'
    ],
    prompt: 'consent'
  });
  res.json({ authUrl });
});

// Step 2: Handle OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('No authorization code provided');
  }
  
  try {
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(newTokens);
    
    // Generate a simple session ID
    const sessionId = Math.random().toString(36).substring(7);
    tokens[sessionId] = newTokens;
    
    // Redirect to success page with session ID
    res.redirect(`/auth/success?session=${sessionId}`);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// Success page
app.get('/auth/success', (req, res) => {
  const { session } = req.query;
  res.send(`
    <html>
      <head>
        <title>Success!</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          .success { color: green; font-size: 24px; }
          .session { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 20px; }
          .close { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
        </style>
        <script>
          // Send message to extension
          if (window.opener) {
            window.opener.postMessage({
              type: 'auth-success',
              sessionId: '${session}'
            }, '*');
          }
        </script>
      </head>
      <body>
        <h1 class="success">✅ Authentication Successful!</h1>
        <p>You can close this window and return to the extension.</p>
        <div class="session">
          <strong>Session ID:</strong> ${session}
        </div>
        <button class="close" onclick="window.close()">Close Window</button>
      </body>
    </html>
  `);
});

// Step 3: Create sheet and deploy script (simplified for Vercel)
app.post('/setup/sheet', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!tokens[sessionId]) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  try {
    // Set up OAuth client with user's tokens
    oauth2Client.setCredentials(tokens[sessionId]);
    
    // Initialize Google APIs
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Create new spreadsheet
    console.log('Creating spreadsheet...');
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Job Application Tracker'
        },
        sheets: [{
          properties: {
            title: 'Applications',
            gridProperties: { rowCount: 1000, columnCount: 26 }
          }
        }]
      }
    });
    
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log('Spreadsheet created:', spreadsheetId);
    
    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Applications!A1:Z1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Date Applied', 'Company', 'Position', 'URL', 'Contact', 
          'Status', 'Notes', 'Salary Range', 'Location', 'Job Type',
          'Source', 'Resume Version', 'Cover Letter', 'Interview Date',
          'Follow Up Date', 'Response', 'Rejection Reason'
        ]]
      }
    });
    
    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                  textFormat: { 
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true 
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });
    
    // Note: Apps Script API deployment is complex for Vercel's serverless environment
    // For now, we'll provide a manual script that users can add
    const scriptCode = `
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById('${spreadsheetId}').getSheetByName('Applications');
    const data = JSON.parse(e.postData.contents);
    
    const timestamp = new Date().toLocaleDateString();
    const rowData = [
      timestamp,
      data.company || '',
      data.position || '',
      data.url || '',
      data.contact || '',
      data.status || 'Applied',
      data.notes || '',
      data.salary || '',
      data.location || '',
      data.jobType || '',
      data.source || '',
      data.resumeVersion || '',
      data.coverLetter || '',
      data.interviewDate || '',
      data.followUpDate || '',
      data.response || '',
      data.rejectionReason || ''
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
    
    // Clean up session
    delete tokens[sessionId];
    
    // Return results with instructions
    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      scriptCode,
      instructions: 'Sheet created! To complete setup, you need to manually add the Apps Script. See instructions in extension.',
      message: 'Setup complete! Your Google Sheet is ready.'
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      error: 'Setup failed', 
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Export for Vercel
module.exports = app;
