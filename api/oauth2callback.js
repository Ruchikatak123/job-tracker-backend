import { google } from 'googleapis';
import createSheetAutomation from './createSheet';

export default async function handler(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing 'code' in query");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    // 1. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. Automatically create sheet + script + web app
    const webAppUrl = await createSheetAutomation(oauth2Client);

    console.log("Final WebApp URL:", webAppUrl);

    // 3. Redirect to an extension-friendly page
    const redirectUrl =
      `${process.env.BACKEND_URL}/success.html?webAppUrl=${encodeURIComponent(webAppUrl)}`;

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error("OAuth2 Callback Error:", error);
    return res.status(500).send("OAuth callback failed");
  }
}
