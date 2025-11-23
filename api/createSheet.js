import { google } from "googleapis";

export default async function createSheetAutomation(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const scriptApi = google.script({ version: "v1", auth });

  //
  // 1. CREATE NEW GOOGLE SHEET
  //
  const sheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: "Job Tracker Sheet",
      },
    },
  });

  const spreadsheetId = sheet.data.spreadsheetId;
  console.log("Spreadsheet ID:", spreadsheetId);

  //
  // 2. ADD HEADER ROW
  //
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "A1:F1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["Company", "Title", "Link", "Status", "Date", "Location"],
      ],
    },
  });

  //
  // 3. CREATE AN APPS SCRIPT PROJECT
  //
  const scriptProject = await scriptApi.projects.create({
    requestBody: {
      title: "Job Tracker Automation Script",
    },
  });

  const scriptId = scriptProject.data.scriptId;

  //
  // 4. INJECT GOOGLE APPS SCRIPT CODE
  //
  const scriptCode = `
function doPost(e) {
  const ss = SpreadsheetApp.openById("${spreadsheetId}");
  const sheet = ss.getSheets()[0];
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.company,
    data.title,
    data.link,
    data.status,
    data.date,
    data.location
  ]);

  return ContentService.createTextOutput("success");
}
  `;

  await scriptApi.projects.updateContent({
    scriptId,
    requestBody: {
      files: [
        {
          name: "Code",
          type: "SERVER_JS",
          source: scriptCode,
        },
      ],
    },
  });

  //
  // 5. DEPLOY AS WEB APP
  //
  const deployment = await scriptApi.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber: 1,
      deploymentConfig: {
        webApp: {
          executeAs: "USER_ACCESSING",
          access: "ANYONE",
        },
      },
