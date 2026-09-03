const { oAuth2Client } = require("../auth.js");
const { google } = require("googleapis");
const { randomUUID } = require("crypto");

async function obtenerCarpetaRaiz() {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const busqueda = await drive.files.list({
    q: `name = 'Junta Abogados - Sistema' and mimeType = 'application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
  });

  if (busqueda.data.files.length > 0) {
    return busqueda.data.files[0].id;
  }

  const nuevaCarpeta = await drive.files.create({
    resource: {
      name: "Junta Abogados - Sistema",
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  return nuevaCarpeta.data.id;
}

async function obtenerClientesJson(idCarpetaRaiz) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const busqueda = await drive.files.list({
    q: `'${idCarpetaRaiz}' in parents and name = 'clientes.json' and mimeType = 'application/json'`,
    fields: "files(id, name)",
  });

  if (busqueda.data.files.length > 0) {
    const idArchivo = busqueda.data.files[0].id;

    const respuesta = await drive.files.get({
      fileId: idArchivo,
      alt: "media",
    });

    console.log(respuesta.data);
    return respuesta.data;
  }

  const nuevoArchivo = await drive.files.create({
    requestBody: {
      name: "clientes.json",
      parents: [idCarpetaRaiz],
    },
    media: {
      mimeType: "application/json",
      body: JSON.stringify([]),
    },
    fields: "id",
  });

  return [];
}

async function crearCliente(datosCliente, idCarpetaRaiz) {
  const { nombre, tipoIdentificacion, identificacion, descripcionCaso } = datosCliente;

  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);

  const yaExiste = listaClientes.find((cliente) => {
    return cliente.tipoIdentificacion === tipoIdentificacion && cliente.identificacion === identificacion;
  });

  if (yaExiste) {
    throw new Error("Ya existe un cliente con esa identificación.");
  }

  const idCarpeta = await crearCarpetaCliente(nombre, identificacion, tipoIdentificacion, idCarpetaRaiz);

  const clienteNuevo = {
    UUID: randomUUID(),
    nombre,
    tipoIdentificacion,
    identificacion,
    descripcionCaso,
    archivosInfo: [],
    archivosDatos: [],
    misiones: [],
    estado: "activo", // pensadolo un poco, quizas en algun futuro ponga más variables de texto con significado.
    idCarpeta,
  };

  listaClientes.push(clienteNuevo);
  await actualizarClientesJson(listaClientes, idCarpetaRaiz);
  return clienteNuevo;
}

async function crearCarpetaCliente(nombre, identificacion, tipoIdentificacion, idCarpetaRaiz) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const nombreCarpeta = `${nombre} - ${tipoIdentificacion} - ${identificacion}`;

  const busqueda = await drive.files.list({
    q: `'${idCarpetaRaiz}' in parents and name = '${nombreCarpeta}' and mimeType = 'application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
  });

  if (busqueda.data.files.length > 0) {
    return busqueda.data.files[0].id;
  }

  const nuevaCarpeta = await drive.files.create({
    requestBody: {
      name: nombreCarpeta,
      mimeType: "application/vnd.google-apps.folder",
      parents: [idCarpetaRaiz],
    },
    fields: "id",
  });

  return nuevaCarpeta.data.id;
}

async function actualizarClientesJson(listaClientes, idCarpetaRaiz) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const busqueda = await drive.files.list({
    q: `'${idCarpetaRaiz}' in parents and name = 'clientes.json' and mimeType = 'application/json'`,
    fields: "files(id, name)",
  });

  const idArchivo = busqueda.data.files[0].id;

  await drive.files.update({
    fileId: idArchivo,
    media: {
      mimeType: "application/json",
      body: JSON.stringify(listaClientes),
    },
  });
}

async function actualizarCliente(UUID, datosActualizados, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);

  const posicion = listaClientes.findIndex((cliente) => {
  return cliente.UUID === UUID;
    });

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con esa identificación.");
  }

  const conflicto = listaClientes.find((cliente) => {
    return (
      cliente.UUID !== UUID &&
      cliente.tipoIdentificacion === (datosActualizados.tipoIdentificacion || listaClientes[posicion].tipoIdentificacion) &&
      cliente.identificacion === (datosActualizados.identificacion || listaClientes[posicion].identificacion)
    );
  });

if (conflicto) {
  throw new Error("Ya existe otro cliente con esa identificación.");
}

  listaClientes[posicion].nombre = datosActualizados.nombre || listaClientes[posicion].nombre;
  listaClientes[posicion].descripcionCaso = datosActualizados.descripcionCaso || listaClientes[posicion].descripcionCaso;
  listaClientes[posicion].tipoIdentificacion = datosActualizados.tipoIdentificacion || listaClientes[posicion].tipoIdentificacion;
  listaClientes[posicion].identificacion = datosActualizados.identificacion || listaClientes[posicion].identificacion;

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
}

async function moverAPapelera(UUID, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);


  const posicion = listaClientes.findIndex((cliente) => {
  return cliente.UUID === UUID;
    });

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  listaClientes[posicion].estado = "papelera";

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
}

async function restaurarCliente(UUID, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);


  const posicion = listaClientes.findIndex((cliente) => {
  return cliente.UUID === UUID;
    });

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  listaClientes[posicion].estado = "activo";

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
}

async function borrarClientePermanente(UUID, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);

  
  const cliente = listaClientes.find((cliente) => {
  return cliente.UUID === UUID;
    });

  if (!cliente) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  await drive.files.delete({
    fileId: cliente.idCarpeta,
  });

  const listaActualizada = listaClientes.filter((cliente)=> cliente.UUID !== UUID);

  await actualizarClientesJson(listaActualizada, idCarpetaRaiz);

  return cliente;
}

async function agregarMision(UUID, textoMision, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);

  const posicion = listaClientes.findIndex((cliente) => cliente.UUID === UUID);

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  const nuevaMision = {
    id: Date.now(),
    texto: textoMision,
  };

  listaClientes[posicion].misiones.push(nuevaMision);

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
};

async function eliminarMision(UUID, idMision, idCarpetaRaiz) {
  const listaClientes = await obtenerClientesJson(idCarpetaRaiz);

  const posicion = listaClientes.findIndex((cliente) => cliente.UUID === UUID);

  if (posicion === -1) {
    throw new Error("No se encontró un cliente con ese UUID.");
  }

  listaClientes[posicion].misiones = 
  listaClientes[posicion].misiones.filter((mision) => mision.id !== idMision);

  await actualizarClientesJson(listaClientes, idCarpetaRaiz);

  return listaClientes[posicion];
};

module.exports = {
  obtenerCarpetaRaiz,
  obtenerClientesJson,
  crearCliente,
  crearCarpetaCliente,
  actualizarClientesJson,
  actualizarCliente,
  moverAPapelera, restaurarCliente,
  borrarClientePermanente,
  agregarMision
};