import { clientes } from "./init.js";
import { mostrarDetalle } from "./detalle.js";


const contenedor = document.getElementById("lista-clientes");
const buscador = document.getElementById("buscador");
export const vistaLista = document.getElementById("vista-lista");

export function renderizarLista(listaClientes) {
  const html = listaClientes.map((cliente) => {
    return `<li data-id="${cliente.UUID}"> ${cliente.nombre} - ${cliente.tipoIdentificacion} - ${cliente.identificacion}</li>`;
  }).join("");

  contenedor.innerHTML = html;
}

buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();

  const filtrados = clientes.filter((cliente) => {
    return (
      cliente.estado === "activo" &&
      (cliente.nombre.toLowerCase().includes(texto) || cliente.identificacion.toLowerCase().includes(texto))
    );
  });

  renderizarLista(filtrados);
});

contenedor.addEventListener("click", (event) => {
  const li = event.target.closest("li");
  if (!li) 
    return;

  const UUID= li.dataset.id 

  const cliente= clientes.find((cliente) => cliente.UUID === UUID);

  mostrarDetalle(cliente);
});