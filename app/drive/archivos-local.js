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

    let idCarpetaDestino;

    if (tipoPestana === "info") {
      idCarpetaDestino = listaClientes[posicion].idCarpetaInfo;} 
    else {
      idCarpetaDestino = listaClientes[posicion].idCarpetaDatos;
    }

  const archivoSubido = await drive.files.create({
    requestBody: {
      name: nombreArchivo,
      parents: [idCarpetaDestino],
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

async function listarArchivosDeCarpeta(idCarpeta) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const resultado = await drive.files.list({
    q: `'${idCarpeta}' in parents and trashed = false`,
    fields: "files(id, name)",
  });

    return resultado.data.files;
}

function compararArchivos(archivosDrive, archivosJson) {
 
  const nuevos = archivosDrive.filter((archivoDrive) => {
    const existeEnJson = archivosJson.some((archivoJson) => archivoJson.idArchivo === archivoDrive.id);
    return !existeEnJson;
});

 const faltantes = archivosJson.filter((archivoJson) => {
  const faltaEnJson = archivosDrive.some((archivoDrive) => archivoDrive.id === archivoJson.idArchivo);
  return !faltaEnJson;

 });

   return { nuevos, faltantes };
  }

async function sincronizarArchivosCliente(UUID, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);
  const posicion = listaClientes.findIndex((cliente) => cliente.UUID === UUID);

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  const cliente = listaClientes[posicion];

  const archivosDriveInfo = await listarArchivosDeCarpeta (cliente.idCarpetaInfo);
  const archivosDriveDatos = await listarArchivosDeCarpeta (cliente.idCarpetaDatos);

  const diffInfo = compararArchivos (archivosDriveInfo ,cliente.archivosInfo);
  const diffDatos = compararArchivos (archivosDriveDatos ,cliente.archivosDatos);

  return { info: diffInfo, datos: diffDatos };
}

async function aplicarSincronizacion(UUID, idCarpetaRaiz) {
  const { info, datos } = await sincronizarArchivosCliente(UUID, idCarpetaRaiz);

  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);
  const posicion = listaClientes.findIndex((cliente) => cliente.UUID === UUID);
  const cliente = listaClientes[posicion];

  const nuevosInfoConvertidos = info.nuevos.map((archivo) => ({
    nombre: archivo.name,
    idArchivo: archivo.id,
  }));

  const nuevosDatosConvertidos = datos.nuevos.map((archivo) => ({
    nombre: archivo.name,
    idArchivo: archivo.id,
  }));

  cliente.archivosInfo = cliente.archivosInfo
    .filter((archivo) => !info.faltantes.some((f) => f.idArchivo === archivo.idArchivo))
    .concat(nuevosInfoConvertidos);

  cliente.archivosDatos = cliente.archivosDatos
    .filter((archivo) => !datos.faltantes.some((f) => f.idArchivo === archivo.idArchivo))
    .concat(nuevosDatosConvertidos);

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);
  return cliente;
}

module.exports = { subirArchivoLocal, eliminarArchivoLocal, 
                   listarArchivosDeCarpeta, compararArchivos,
                   sincronizarArchivosCliente,aplicarSincronizacion };