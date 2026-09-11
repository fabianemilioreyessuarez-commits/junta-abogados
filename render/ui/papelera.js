import { clientes } from "./init.js";
import { iniciar } from "./init.js";
import { vistaLista } from "./lista.js";


const btnVerPapelera = document.getElementById("btn-ver-papelera");
const vistaPapelera = document.getElementById("vista-papelera");
const btnVolverPapelera = document.getElementById("btn-volver-papelera");
const listaPapelera = document.getElementById("lista-papelera");
const modalConfirmarBorrado = document.getElementById("modal-confirmar-borrado");
const btnConfirmarBorrado = document.getElementById("btn-confirmar-borrado");
const btnCancelarBorrado = document.getElementById("btn-cancelar-borrado");


export let UUIDaBorrar= null;
let operacionEnCurso = false;

export function renderizarPapelera(listaClientes) {
  const html = listaClientes.map((cliente) => {
    return `<li data-id="${cliente.UUID}">
      ${cliente.nombre} - ${cliente.tipoIdentificacion} - ${cliente.identificacion}
      <button class="btn-restaurar">Restaurar</button>
      <button class="btn-borrar-permanente">Borrar permanente</button>
    </li>`;
  }).join("");

  listaPapelera.innerHTML = html;
};

btnVerPapelera.addEventListener("click", () => {
  const clientesEnPapelera = clientes.filter((cliente) => cliente.estado === "papelera");
  renderizarPapelera(clientesEnPapelera);

  vistaLista.style.display = "none";
  vistaPapelera.style.display = "block";
});

btnVolverPapelera.addEventListener("click", () => {
  vistaPapelera.style.display = "none";
  vistaLista.style.display = "block";
});

listaPapelera.addEventListener("click", async (event) => {
  const li = event.target.closest("li");
  if (!li) return;

  const UUID = li.dataset.id;

  if (event.target.classList.contains("btn-restaurar")) {
    if (operacionEnCurso) return;
      operacionEnCurso = true;
    try {
      await window.clientesAPI.restaurarCliente(UUID);
      await iniciar();
      const clientesEnPapelera = clientes.filter((cliente) => cliente.estado === "papelera");
      renderizarPapelera(clientesEnPapelera);
    } catch (error) {
      console.log("No se pudo restaurar el cliente:", error.message);
    } finally {
        operacionEnCurso = false;
    }
  }

  if (event.target.classList.contains("btn-borrar-permanente")) {
    UUIDaBorrar = UUID;
    modalConfirmarBorrado.style.display = "flex";
  }
});

btnConfirmarBorrado.addEventListener("click", async () => {
  if (operacionEnCurso) return;
  operacionEnCurso = true;

  try {
    await window.clientesAPI.borrarClientePermanente(UUIDaBorrar);
    await iniciar();
    const clientesEnPapelera = clientes.filter((cliente) => cliente.estado === "papelera");
    renderizarPapelera(clientesEnPapelera);
  } catch (error) {
    console.log("No se pudo borrar el cliente:", error.message);
  } finally {
    modalConfirmarBorrado.style.display = "none";
    UUIDaBorrar = null;
    operacionEnCurso = false;
  }
});

btnCancelarBorrado.addEventListener("click", () => {
  modalConfirmarBorrado.style.display = "none";
  UUIDaBorrar = null;
});