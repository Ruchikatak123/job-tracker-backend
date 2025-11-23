const { google } = require("googleapis");

module.exports = async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI // MUST MATCH GOOGLE CLOUD
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/script.projects"
      ],
      prompt: "consent",
    });

    return res.status(200).json({ authUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
