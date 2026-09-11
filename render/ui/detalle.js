import { vistaLista } from "./lista.js";
import { iniciar } from "./init.js";



export const vistaDetalle= document.getElementById("vista-detalle");
export const btnVolver= document.getElementById("btn-volver");
export const inputMision = document.getElementById("input-mision");
export const btnAgregarMision = document.getElementById("btn-agregar-mision");
export const listaMisiones = document.getElementById("lista-misiones");
export const notario = document.getElementById("notario");
export const btnMoverPapelera = document.getElementById("btn-mover-papelera");
export const btnSubirArchivo = document.getElementById("btn-subir-archivo");
export const btnSincronizarArchivos = document.getElementById("btn-sincronizar-archivos");
export const modalSincronizar = document.getElementById("modal-sincronizar");



let diffPendiente = null;
let operacionEnCurso = false;
export let clienteActivo= null;
export let pestanaActiva = "info"; 

export function mostrarDetalle(cliente) {
  clienteActivo= cliente;

  document.getElementById("detalle-nombre").textContent = cliente.nombre;
  document.getElementById("detalle-id").textContent = `${cliente.tipoIdentificacion} - ${cliente.identificacion}`;

  mostrarPestana("info");
  actualizarNotario();

  vistaLista.style.display = "none";
  vistaDetalle.style.display = "block";
  notario.style.display = "block";
};

export function mostrarPestana(nombrePestana) {
  pestanaActiva = nombrePestana;
  const archivos = nombrePestana === "info" ? clienteActivo.archivosInfo : clienteActivo.archivosDatos;
  document.getElementById("detalle-contenido").innerHTML =
    archivos.map((archivo) => `<li>${archivo.nombre} <button class="btn-eliminar-archivo" data-id="${archivo.idArchivo}">✕</button></li>`)
    .join("");
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("activa", tab.dataset.tab === nombrePestana);
  })
};

export function actualizarNotario() {
  listaMisiones.innerHTML= clienteActivo.misiones
  .map((mision) => 
    `<li>${mision.texto}<button class="btn-eliminar-mision" data-id="${mision.id}">✕</button>
      </li>
    `)
    .join(""); 
};

function renderizarDiff(diff, etiqueta) {
  const nuevosHtml = diff.nuevos.map((archivo) => `<li>+ ${archivo.name}</li>`).join("");
  const faltantesHtml = diff.faltantes.map((archivo) => `<li>- ${archivo.nombre}</li>`).join("");

  return `<h4>${etiqueta}</h4><ul>${nuevosHtml}${faltantesHtml}</ul>`;
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    mostrarPestana(tab.dataset.tab);
  });
});

btnVolver.addEventListener("click", () => {
  vistaDetalle.style.display = "none";
  vistaLista.style.display = "block";
  notario.style.display = "none";
});

btnAgregarMision.addEventListener("click", async () => {
  const texto = inputMision.value.trim();
  if (!texto) return;

  try {
    clienteActivo = await window.clientesAPI.agregarMision(clienteActivo.UUID, texto);
    inputMision.value = "";
    actualizarNotario();
  } catch (error) {
    console.log("No se pudo agregar la misión:", error.message);
  }
});

btnSincronizarArchivos.addEventListener("click", async () => {
  if (operacionEnCurso) return;
  operacionEnCurso = true;

  try {
    diffPendiente = await window.clientesAPI.sincronizarArchivosCliente(clienteActivo.UUID);

    document.getElementById("diff-info").innerHTML = renderizarDiff(diffPendiente.info, "Información del cliente");
    document.getElementById("diff-datos").innerHTML = renderizarDiff(diffPendiente.datos, "Datos añadidos");

    modalSincronizar.style.display = "flex";
  } catch (error) {
    console.log("No se pudo sincronizar:", error.message);
  } finally {
    operacionEnCurso = false;
  }
});

listaMisiones.addEventListener("click", async (event) => {
  const boton = event.target.closest(".btn-eliminar-mision");
  if (!boton) return;

  const idMision = Number(boton.dataset.id);

  try {
    clienteActivo = await window.clientesAPI.eliminarMision(clienteActivo.UUID, idMision);
    actualizarNotario();
  } catch (error) {
    console.log("No se pudo eliminar la misión:", error.message);
  }
});

btnMoverPapelera.addEventListener("click", async () => {
  
  try {
    await window.clientesAPI.moverAPapelera(clienteActivo.UUID);

    vistaDetalle.style.display = "none";
    vistaLista.style.display = "block";
    notario.style.display = "none";

    await iniciar();

  } catch (error) {
    console.log("No se pudo mover a papelera:", error.message);
  }
});

btnSubirArchivo.addEventListener("click", async () => {
  if (operacionEnCurso) return;
  operacionEnCurso = true;

  try {
    const clienteActualizado = await window.clientesAPI.subirArchivoLocal(clienteActivo.UUID, pestanaActiva);
    
    if (clienteActualizado) {
      clienteActivo = clienteActualizado;
      mostrarPestana(pestanaActiva);
    }
  } catch (error) {
    console.log("No se pudo subir el archivo:", error.message);
  } finally {
    operacionEnCurso = false;
  }
});

document.getElementById("detalle-contenido").addEventListener("click", async (event) => {
  const boton = event.target.closest(".btn-eliminar-archivo");
  if (!boton) return;
  if (operacionEnCurso) return;
  operacionEnCurso = true;

  const idArchivo = boton.dataset.id;
  boton.disabled = true;

  try {
    clienteActivo = await window.clientesAPI.eliminarArchivoLocal(clienteActivo.UUID, idArchivo);
    mostrarPestana(pestanaActiva);
  } catch (error) {
    console.log("No se pudo eliminar el archivo:", error.message);
    boton.disabled = false;
  } finally {
    operacionEnCurso = false;
  }
});

document.getElementById("btn-confirmar-sincronizar").addEventListener("click", async () => {
  if (operacionEnCurso) return;
  operacionEnCurso = true;

  try {
    clienteActivo = await window.clientesAPI.aplicarSincronizacion(clienteActivo.UUID);
    mostrarPestana(pestanaActiva);
  } catch (error) {
    console.log("No se pudo aplicar la sincronización:", error.message);
  } finally {
    modalSincronizar.style.display = "none";
    diffPendiente = null;
    operacionEnCurso = false;
  }
});

document.getElementById("btn-cancelar-sincronizar").addEventListener("click", () => {
  modalSincronizar.style.display = "none";
  diffPendiente = null;
});