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