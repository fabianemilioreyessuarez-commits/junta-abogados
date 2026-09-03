const {shell} = require("electron")
const fs= require("fs");
const path= require("path");
const {google}= require("googleapis");
const credenciales= JSON.parse(fs.readFileSync(path.join(__dirname, "credenciales.json"), "utf-8"));
const {client_secret, client_id}= credenciales.installed;
const REDIRECT_URI= "http://localhost:3000";
const oAuth2Client= new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
const RUTA_TOKEN = path.join(__dirname, "..", "token-google.json");
const http= require("http");

function autenticar() {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/drive.file",
    });

    const server = http.createServer(async (req, res) => {
      const urlParams = new URL(req.url, REDIRECT_URI);
      const code = urlParams.searchParams.get("code");

      if (!code) {
        res.end();
        return;
      }

      res.end("Autenticación completa...");
      server.close();

      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      resolve(tokens);
    });

    server.listen(3000, () => {
      shell.openExternal(authUrl);
    });
  });
}

async function obtenerToken() {

  if (fs.existsSync(RUTA_TOKEN)) {
    const tokenGuardado = JSON.parse(fs.readFileSync(RUTA_TOKEN, "utf-8"));
    oAuth2Client.setCredentials(tokenGuardado);
  } else {
    const tokens = await autenticar();
    fs.writeFileSync(RUTA_TOKEN, JSON.stringify(tokens));
  }
}

module.exports = { oAuth2Client, obtenerToken };