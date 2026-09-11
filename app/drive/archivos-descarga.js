const { google } = require("googleapis");
const { oAuth2Client } = require("../auth.js");
const fs = require("fs");
const { pipeline } = require('node:stream/promises');

async function descargarArchivo(idArchivo, rutaDestino) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const respuesta = await drive.files.get(
    { fileId: idArchivo, alt: "media" },
    { responseType: "stream" }
  );

  await pipeline(
    respuesta.data,
    fs.createWriteStream(rutaDestino)
  );
}

module.exports = { descargarArchivo };