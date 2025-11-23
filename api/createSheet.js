const { google } = require("googleapis");

module.exports = async (req, res) => {
  try {
    const { tokens } = req.body;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const response = await sheets.spreadsheets.create({
      resource: {
        properties: { title: "My Job Applications" }
      }
    });

    return res.json({
      success: true,
      sheetId: response.data.spreadsheetId,
      url: response.data.spreadsheetUrl
    });

  } catch (err) {
    res.status(500).send("Sheet Creation Error: " + err.message);
  }
};
