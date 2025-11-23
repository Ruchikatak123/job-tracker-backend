const { google } = require("googleapis");
const path = require("path");

module.exports = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing authorization code");

    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    const successUrl = `/success.html#tokens=${encodeURIComponent(
      JSON.stringify(tokens)
    )}`;

    return res.redirect(successUrl);

  } catch (err) {
    return res.status(500).send("OAuth Callback Error: " + err.message);
  }
};
