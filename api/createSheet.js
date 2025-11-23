const { google } = require("googleapis");

module.exports = async (req, res) => {
  try {
    const tokens = JSON.parse(req.body.tokens);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const newSheet = await sheets.spreadsheets.create({
      resource: {
        properties: { title: "My Job Applications" },
      }
    });

    return res.status(200).json({
      spreadsheetId: newSheet.data.spreadsheetId,
      url: newSheet.data.spreadsheetUrl
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
