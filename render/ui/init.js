import { renderizarLista } from "./lista.js";
import "./papelera.js";
import "./formulario.js";


export let clientes= [];

export async function iniciar() {
  clientes = await window.clientesAPI.obtenerClientes();
  const clientesActivos = clientes.filter((cliente) => cliente.estado === "activo");
  renderizarLista(clientesActivos);
};

iniciar();