const { google } = require("googleapis");
const { oAuth2Client } = require("../auth.js");
const fs = require("fs");
const path = require("path");

const { obtenerClientesJson, actualizarClientesJson } = require("./clientes.js");

async function subirArchivoLocal(UUID, rutaArchivo, tipoPestana, idCarpetaRaiz) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);
  const posicion = listaClientes.findIndex((cliente) => cliente.UUID === UUID);

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  const nombreArchivo = path.basename(rutaArchivo);

    console.log("Ruta del archivo a subir:", rutaArchivo);

  const archivoSubido = await drive.files.create({
    requestBody: {
      name: nombreArchivo,
      parents: [listaClientes[posicion].idCarpeta],
    },
    media: {
      body: fs.createReadStream(rutaArchivo),
    },
    fields: "id",
  });
  console.log("ID real del archivo subido a Drive:", archivoSubido.data.id);
  const archivoNuevo = {
    nombre: nombreArchivo,
    idArchivo: archivoSubido.data.id,
  };

  if (tipoPestana === "info") {
    listaClientes[posicion].archivosInfo.push(archivoNuevo);
  } else {
    listaClientes[posicion].archivosDatos.push(archivoNuevo);
  }

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
}

async function eliminarArchivoLocal(UUID, idArchivo, idCarpetaRaiz) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);
  const posicion = listaClientes.findIndex((cliente) => cliente.UUID === UUID);

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  try {
    await drive.files.delete({ fileId: idArchivo });
  } catch (error) {
    if (error.code !== 404) {
      throw error; 
    }
  }

  listaClientes[posicion].archivosInfo = listaClientes[posicion].archivosInfo.filter(
    (archivo) => archivo.idArchivo !== idArchivo
  );
  listaClientes[posicion].archivosDatos = listaClientes[posicion].archivosDatos.filter(
    (archivo) => archivo.idArchivo !== idArchivo
  );

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
}

module.exports = { subirArchivoLocal, eliminarArchivoLocal };