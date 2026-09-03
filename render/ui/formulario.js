import { clientes, iniciar } from "./init.js";
import { vistaLista } from "./lista.js";
import { notario, vistaDetalle, clienteActivo } from "./detalle.js";

const btnNuevoCliente = document.getElementById("btn-nuevo-cliente");
const vistaNuevoCliente = document.getElementById("vista-nuevo-cliente");
const btnCancelarNuevo = document.getElementById("btn-cancelar-nuevo");
const formNuevoCliente = document.getElementById("form-nuevo-cliente");
const btnEditarCliente = document.getElementById("btn-editar-cliente");
const tituloFormCliente = document.getElementById("titulo-form-cliente");
const btnSubmitFormCliente = document.getElementById("btn-submit-form-cliente");

export let UUIDenEdicion = null;

btnNuevoCliente.addEventListener("click", () => {
  UUIDenEdicion = null;
  vistaNuevoCliente.style.display = "block";
  vistaLista.style.display = "none";
  notario.style.display = "none";
});

btnCancelarNuevo.addEventListener("click", () => {
  UUIDenEdicion = null;
  vistaLista.style.display = "block";
  vistaNuevoCliente.style.display = "none";
  notario.style.display = "none";
});

formNuevoCliente.addEventListener("submit", async (event) => {
  event.preventDefault();

  const datosCliente = {
    nombre: document.getElementById("nc-nombre").value,
    tipoIdentificacion: document.getElementById("nc-tipo-identificacion").value,
    identificacion: document.getElementById("nc-identificacion").value,
    descripcionCaso: document.getElementById("nc-descripcion").value,
  };

  try {
    if (UUIDenEdicion) {
      await window.clientesAPI.actualizarCliente(UUIDenEdicion, datosCliente);
      UUIDenEdicion = null;
    } else {
      await window.clientesAPI.crearCliente(datosCliente);
    }

    tituloFormCliente.textContent = "Nuevo cliente";
    btnSubmitFormCliente.textContent = "Crear cliente";

    vistaLista.style.display = "block";
    vistaNuevoCliente.style.display = "none";
    await iniciar();
    formNuevoCliente.reset();
  } catch (error) {
    console.log("No se pudo guardar el cliente:", error.message);
  }
});

btnEditarCliente.addEventListener("click", () => {
  UUIDenEdicion = clienteActivo.UUID;

  document.getElementById("nc-nombre").value = clienteActivo.nombre;
  document.getElementById("nc-tipo-identificacion").value = clienteActivo.tipoIdentificacion;
  document.getElementById("nc-identificacion").value = clienteActivo.identificacion;
  document.getElementById("nc-descripcion").value = clienteActivo.descripcionCaso;

  tituloFormCliente.textContent = "Editar cliente";
  btnSubmitFormCliente.textContent = "Guardar cambios";

  vistaDetalle.style.display = "none";
  vistaNuevoCliente.style.display = "block";
  notario.style.display = "none";
});
