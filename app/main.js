const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path= require("path");
const {obtenerToken} = require("./auth.js");
const {obtenerCarpetaRaiz, obtenerClientesJson, 
       crearCliente, crearCarpetaCliente, 
       actualizarClientesJson, actualizarCliente,
       moverAPapelera, restaurarCliente, borrarClientePermanente,
       agregarMision, eliminarMision} = require ("./drive/clientes.js");
const { subirArchivoLocal, eliminarArchivoLocal } = require ("./drive/archivos-local.js");
// const { fileURLToPath } = require("url"); no sé por qué la tengo aquí, pero no quiero borrarla

let idCarpetaRaiz;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700, 
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },

  });

    win.loadFile(path.join(__dirname, "..", "render", "index.html"));
}

ipcMain.handle("darClientes", async () => {
  return await obtenerClientesJson(idCarpetaRaiz);
});

ipcMain.handle("crearCliente", async (event, datosCliente) => {
  return await crearCliente(datosCliente, idCarpetaRaiz);
}); 

ipcMain.handle("moverAPapelera", async (event, UUID) => {
  return await moverAPapelera(UUID, idCarpetaRaiz);
});

ipcMain.handle("restaurarCliente", async (event, UUID) => {
  return await restaurarCliente(UUID, idCarpetaRaiz);
});

ipcMain.handle("borrarClientePermanente", async (event, UUID) => {
  return await borrarClientePermanente(UUID, idCarpetaRaiz);
});

ipcMain.handle("actualizarCliente", async (event, UUID, datosActualizados) => {
  return await actualizarCliente(UUID, datosActualizados, idCarpetaRaiz);
});

ipcMain.handle("agregarMision", async (event, UUID, textoMision)=> 
  {return await agregarMision(UUID, textoMision, idCarpetaRaiz);

  });

ipcMain.handle("eliminarMision", async (event, UUID, idMision) => {
  return await eliminarMision(UUID, idMision, idCarpetaRaiz);
});

ipcMain.handle("subirArchivoLocal", async (event, UUID, tipoPestana) => {
  const resultado = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
  });

  if (resultado.canceled) {
    return null;
  }

 let clienteActualizado;
 for (const rutaArchivo of resultado.filePaths) {
   clienteActualizado = await subirArchivoLocal(UUID, rutaArchivo, tipoPestana, idCarpetaRaiz);
 }
return clienteActualizado;
});

ipcMain.handle("eliminarArchivoLocal", async (event, UUID, idArchivo) => {
  return await eliminarArchivoLocal(UUID, idArchivo, idCarpetaRaiz);
});

app.whenReady().then(async () => {
  await obtenerToken();
  
  idCarpetaRaiz = await obtenerCarpetaRaiz();
  console.log("ID de la carpeta raíz:", idCarpetaRaiz);

  createWindow();

  console.log("todo bien");
});

/*Nombre original del json con la autentificacíon= client_secret_789450277942-oq9udtoqatnk1ti27m8e0uqu17ieh75h.apps.googleusercontent.com*/