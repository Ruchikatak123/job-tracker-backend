const { google } = require("googleapis");

module.exports = async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/script.projects"
      ]
    });

    // ⬇️ THIS IS THE IMPORTANT LINE
    // instead of res.json({ authUrl: url });
    return res.redirect(url);

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(500).send("Error generating auth URL");
  }
};
