const { google } = require("googleapis");

module.exports = (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/script.projects"
      ],
      prompt: "consent"
    });

    return res.status(200).json({ authUrl: url });
  } catch (err) {
    return res.status(500).send("Auth URL Error: " + err.message);
  }
};
