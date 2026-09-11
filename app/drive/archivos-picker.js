// archivos-picker.js
const { oAuth2Client } = require("../auth.js");
const { shell } = require("electron");
const http = require("http");


function abrirPicker() {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/drive.file",
      trigger_onepick: "true",
      prompt: "consent",
    });
    
    const server = http.createServer (async(req, res) => {
        const urlParams = new URL(req.url, "http://localhost:3000");
        const code = urlParams.searchParams.get("code");
        const fileIds = urlParams.searchParams.get("picked_file_ids");
        if (!code) {
            res.end();
            return;
        }

        res.end("Autenticación completa...");
        server.close();

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        const fileIdsArray = fileIds ? fileIds.split(",") : [];
        resolve({ tokens, fileIds: fileIdsArray });
      }catch (error) {
      reject(error)}
    });

    server.listen(3000, () => {
      shell.openExternal(authUrl);
    });
  });
}

module.exports = { abrirPicker };