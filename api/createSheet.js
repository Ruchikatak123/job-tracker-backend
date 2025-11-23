const { google } = require('googleapis');

module.exports = async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token, refresh_token });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Create sheet
    const file = await drive.files.create({
      requestBody: {
        name: 'Job Applications',
        mimeType: 'application/vnd.google-apps.spreadsheet'
      }
    });

    const sheetId = file.data.id;

    // 2. Add columns
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:F1",
      valueInputOption: "RAW",
      requestBody: {
        values: [["Company", "Title", "Link", "Status", "Date", "Location"]]
      }
    });

    // 3. Return URL
    return res.status(200).json({
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      sheetId
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
