const { google } = require("googleapis");

module.exports = async (req, res) => {
  try {
    const code = req.query.code;

    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    return res.redirect(`/success.html#tokens=${encodeURIComponent(JSON.stringify(tokens))}`);
  } catch (err) {
    return res.status(500).send("OAuth Callback Error: " + err.message);
  }
};

