const {contextBridge, ipcRenderer} = require ('electron');

contextBridge.exposeInMainWorld('clientesAPI', {
    obtenerClientes: () => ipcRenderer.invoke('darClientes'),
    crearCliente: (datosCliente) => ipcRenderer.invoke('crearCliente', datosCliente),
    moverAPapelera: (UUID) => ipcRenderer.invoke('moverAPapelera', UUID),
    restaurarCliente: (UUID) => ipcRenderer.invoke('restaurarCliente', UUID),
    borrarClientePermanente: (UUID) => ipcRenderer.invoke('borrarClientePermanente', UUID),
    actualizarCliente: (UUID, datosActualizados) => ipcRenderer.invoke('actualizarCliente', UUID, datosActualizados),
    agregarMision: (UUID, textoMision) => ipcRenderer.invoke('agregarMision', UUID, textoMision),
    eliminarMision: (UUID, idMision) => ipcRenderer.invoke('eliminarMision',UUID, idMision),
    subirArchivoLocal: (UUID, tipoPestana) => ipcRenderer.invoke ('subirArchivoLocal', UUID, tipoPestana),
    eliminarArchivoLocal: (UUID, idArchivo) => ipcRenderer.invoke ('eliminarArchivoLocal', UUID, idArchivo),
    sincronizarArchivosCliente: (UUID) => ipcRenderer.invoke ('sincronizarArchivosCliente', UUID),
    aplicarSincronizacion: (UUID) => ipcRenderer.invoke ('aplicarSincronizacion', UUID),
    descargarArchivo: (nombre, idArchivo) => ipcRenderer.invoke ('descargarArchivo', UUID, nombre), 
})