const { google } = require("googleapis");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const { tokens } = req.body;
    if (!tokens) return res.status(400).json({ error: "Missing tokens" });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: "My Job Applications",
        },
        sheets: [
          {
            properties: { title: "Applications" },
            data: [
              {
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Company" } },
                      { userEnteredValue: { stringValue: "Title" } },
                      { userEnteredValue: { stringValue: "Link" } },
                      { userEnteredValue: { stringValue: "Status" } },
                      { userEnteredValue: { stringValue: "Date" } },
                      { userEnteredValue: { stringValue: "Location" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    return res.json({
      success: true,
      spreadsheetUrl: spreadsheet.data.spreadsheetUrl,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Sheet creation failed",
      message: error.message,
    });
  }
};
