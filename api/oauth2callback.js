const express = require("express");
const router = express.Router();
const { google } = require("googleapis");

router.get("/", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.send("Missing code");

    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    return res.redirect("/success.html"); 
  } catch (err) {
    res.send("OAuth Error: " + err.message);
  }
});

module.exports = router;
