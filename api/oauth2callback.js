const { google } = require('googleapis');

module.exports = async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Return tokens to extension
    return res.status(200).send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(${JSON.stringify(tokens)}, "*");
            window.close();
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
