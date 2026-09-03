# Guía de Referencia — Proyecto Junta de Abogados

> Documento vivo. Cada vez que aprendamos algo nuevo, se agrega aquí.
> Úsalo para consultar QUÉ hace algo, no para copiar soluciones completas.

---

## 📦 npm / package.json

### `npm init -y`
Crea un `package.json` con valores por defecto. Es el archivo que describe tu proyecto: nombre, versión, dependencias, punto de entrada.

### `npm install <paquete> --save-dev`
Instala un paquete y lo agrega a `devDependencies` (herramientas de desarrollo, no necesarias en producción final, ej: `electron`).

### `npm install <paquete>` (sin --save-dev)
Instala y agrega a `dependencies` (paquetes que tu app necesita para funcionar en producción).

### `dependencies` vs `devDependencies`
- `dependencies`: lo que tu app necesita para **correr**.
- `devDependencies`: lo que solo necesitas para **desarrollar** (ej: electron, testing tools).
- ⚠️ No edites a mano los paquetes internos de otro paquete (ej: no agregues `debug` o `semver` manualmente — esos vienen incluidos dentro de `electron`).

### `package-lock.json`
Se genera automáticamente. Congela las versiones EXACTAS de todas las dependencias (incluidas las internas) para que la instalación sea idéntica en cualquier máquina. Nunca se edita a mano. Sí se sube a git.

---

## ⚡ Electron — Conceptos base

### Proceso Principal (`main`) vs Proceso de Renderizado (`renderer`)
- **Main**: Node.js puro. Controla ventanas, accede a archivos, hace llamadas a APIs externas (ej: Google Drive).
- **Renderer**: es como un navegador. Solo HTML/CSS/JS normal, sin acceso directo al sistema.
- Se comunican mediante **IPC** (Inter-Process Communication) — lo veremos más adelante.

### `require("electron")`
Importa el módulo de electron para usar sus piezas (`app`, `BrowserWindow`, etc.) dentro del proceso principal.

### `app` (objeto de electron)
Controla el ciclo de vida de toda la aplicación (cuándo inicia, cuándo cierra, etc.)

### `app.whenReady()`
Devuelve una **Promise** que se resuelve cuando Electron terminó de inicializarse. Se usa con `.then()`:
```js
app.whenReady().then(() => {
  // código aquí
});
```
No acepta un callback directo como argumento — a diferencia de eventos tipo `app.on('evento', callback)`.

### `BrowserWindow`
Clase que representa una ventana de la aplicación. Se instancia con `new BrowserWindow({ opciones })`.
Opciones comunes: `width`, `height` (números, NO rangos tipo `800-1200` — eso es una resta en JS).

### `win.loadFile('archivo.html')`
Carga un archivo HTML local dentro de la ventana (`win` = instancia de BrowserWindow).

---

## 🧩 Conceptos de JavaScript que han salido

### Promises y `.then()`
Una Promise es un "recibo" de que algo va a pasar (o ya pasó). `.then(callback)` ejecuta el callback cuando la promesa se cumple. Alternativa moderna: `async/await`.

### Temporal Dead Zone (TDZ) — variables `const`/`let` con el mismo nombre en el mismo scope
Si declaras `const clientes = clientes.find(...)` dentro de un bloque donde YA existe una variable `clientes` de más afuera (ej: la global con todos los clientes), JavaScript reserva el nombre `clientes` para todo el bloque desde el principio — aunque la asignación pase después. Esto hace que, al evaluar el lado derecho (`clientes.find(...)`), JS no sepa si te refieres a la variable de afuera o a la que se está creando ahora mismo, y lanza:
```
Uncaught ReferenceError: Cannot access 'clientes' before initialization
```
**Solución**: usar un nombre distinto para la variable nueva. Si extraes UN elemento de una lista, usa singular (`cliente`), no el mismo nombre que el array (`clientes`).

⚠️ Esto es distinto a nombrar el parámetro de un callback igual que la variable de afuera (ej: `clientes.find((cliente) => cliente.identificacion === id)` — el `cliente` del parámetro es local a esa función flecha y no choca con nada, porque no comparte el mismo scope al mismo tiempo antes de asignarse).

---

## 🖥️ Terminal — Windows

### CMD vs PowerShell
Windows tiene dos terminales distintas con comandos diferentes:
| Acción | CMD | PowerShell |
|---|---|---|
| Borrar carpeta | `rmdir /s /q carpeta` | `Remove-Item -Recurse -Force carpeta` |
| Borrar archivo | `del archivo` | `Remove-Item archivo` |

Comandos tipo `rm -rf` son de Linux/Mac y no funcionan en CMD.

---

## 🎨 Renderizado dinámico (JS + HTML)

### El patrón general
1. Tienes un arreglo de objetos (datos).
2. Recorres el arreglo transformando cada objeto en un string de HTML.
3. Insertas ese HTML dentro de un elemento contenedor ya existente en la página.

### `document.getElementById("id")`
Busca y devuelve el elemento HTML que tiene ese `id`. Es un **método** (se llama con paréntesis).

### `arreglo.map((elemento) => { ... })`
Recorre un arreglo y devuelve un **nuevo arreglo** con el resultado de aplicar la función a cada elemento. Recibe **un solo argumento**: la función. No se le pasa el arreglo de nuevo adentro del paréntesis (`arreglo.map(funcion)`, no `arreglo.map(arreglo)(funcion)`).

Ejemplo:
```js
clientes.map((cliente) => {
  return `<li>${cliente.nombre}</li>`;
})
```

### `.join("")`
Convierte un arreglo de strings en un solo string, uniéndolos con el separador indicado (`""` = sin separador). Se usa después de `.map()` porque `.map()` devuelve un arreglo, y para meterlo en `innerHTML` necesitas un string.

### Acceso a propiedades de un objeto: `objeto.propiedad`
Si tienes `{ nombre: "Juan", identificacion: "CC 123" }`, accedes con `cliente.nombre` y `cliente.identificacion` (usando el mismo nombre exacto que definiste al crear el objeto).

### `elemento.innerHTML`
**Propiedad** (no método — se usa con `=`, no con paréntesis) que representa el HTML que vive *dentro* de un elemento. Asignarle un string reemplaza todo su contenido:
```js
contenedor.innerHTML = html;
```

### Template literals: `` `texto ${variable} texto` ``
Strings con backticks (`` ` ``, no comillas normales) que permiten insertar variables o expresiones dentro con `${...}`.

---

## 🖱️ Navegación lista → detalle (click en un elemento)

### Atributos `data-*` (el "pegamento" entre HTML y JS)
HTML permite atributos personalizados que empiezan con `data-`, para guardar un valor "escondido" en un elemento sin que se vea en pantalla:
```html
<li data-id="123456">Juan Pérez - CC - 123456</li>
```
Desde JavaScript se lee con `.dataset`:
```js
elemento.dataset.id // "123456"
```
**Regla de nombres**: `data-id` → `.dataset.id`. `data-tipo-identificacion` (con guiones) → `.dataset.tipoIdentificacion` (camelCase, sin guiones). Se usa para poder identificar, desde un evento de click, a qué objeto de datos corresponde el elemento que se clickeó.

### Delegación de eventos
En vez de poner un `addEventListener` a cada `<li>` (ineficiente, y además no funcionaría con elementos creados después vía `innerHTML`), se pone **un solo listener en el contenedor padre** (`<ul>`), y se usa `event.target.closest(selector)` para averiguar en cuál hijo se hizo click:
```js
contenedor.addEventListener("click", (event) => {
  const li = event.target.closest("li");
  if (!li) return; // click fuera de un <li>, ignorar

  const id = li.dataset.id;
  const cliente = clientes.find((cliente) => cliente.identificacion === id);

  mostrarDetalle(cliente);
});
```
`closest("li")` funciona bien cuando el `<li>` no tiene hijos anidados complejos. Si más adelante el contenido de cada `<li>` se vuelve más complejo (varios `<div>`/`<span>` adentro), puede ser necesario usar una clase específica como selector (ej: `.closest(".cliente-card")`) en vez del tag genérico.

### Mostrar/ocultar secciones con `style.display`
Para alternar entre dos vistas (ej: lista de clientes vs. detalle de un cliente) sin cambiar de archivo HTML ni recargar nada:
```js
elemento.style.display = "none";  // oculta
elemento.style.display = "block"; // muestra (para elementos tipo <div>)
```
Patrón típico: dos `<div>` en el mismo HTML (`#vista-lista` y `#vista-detalle`), y JS alterna cuál se ve según la acción del usuario (click en un cliente → mostrar detalle; click en "Volver" → mostrar lista). Al escribir esto, siempre revisar que la lógica no quede "al revés" (fácil de confundir cuál va en `"none"` y cuál en `"block"` en cada función).

### Patrón para "pestañas" dentro del detalle (ej: "Información del cliente" / "Datos añadidos")
Cada botón de pestaña tiene `data-tab="info"` o `data-tab="datos"`. Al hacer click, se compara ese valor para decidir qué contenido mostrar dentro de un contenedor común (ej: `#detalle-contenido`), y se marca visualmente cuál pestaña está activa con `classList.toggle(...)`.
Detalle importante: como el click en la pestaña no "sabe" de qué cliente se trata, hace falta guardar una variable como `clienteActivo` al momento de mostrar el detalle, para que la función de cambio de pestaña sepa de dónde sacar los archivos correspondientes.

---

## 📋 Sistema de misiones ("el notario") — CRUD básico en memoria

### Idea general
Una ventana flotante (`position: fixed`) que muestra las misiones del **cliente activo** — igual que las pestañas, depende de `clienteActivo`, y se muestra/oculta junto con `#vista-detalle` (no tiene sentido verla en la pantalla de lista, porque ahí no hay ningún cliente seleccionado todavía).

```js
function mostrarDetalle(cliente) {
  clienteActivo = cliente;
  // ...
  actualizarNotario();
  vistaDetalle.style.display = "block";
  notario.style.display = "block"; // aparece junto con el detalle
}

btnVolver.addEventListener("click", () => {
  vistaDetalle.style.display = "none";
  notario.style.display = "none"; // se oculta junto con el detalle
  // ...
});
```

### Estructura de datos: por qué cada misión necesita un `id`
```js
misiones: [
  { id: 1754345678901, texto: "Redactar demanda inicial" }
]
```
Si solo guardaras el texto (`misiones: ["Redactar demanda"]`), no habría forma confiable de saber CUÁL misión eliminar si dos tuvieran el mismo texto. El `id` es el dato "de verdad" que identifica algo de forma única; el texto es solo lo que ve el usuario. Mismo principio que usar `identificacion` (no `nombre`) para encontrar un cliente.

### `Date.now()` como id simple
Devuelve la fecha/hora actual en milisegundos como número — sirve como id "suficientemente único" cuando los elementos los crea un humano dando click (poco probable que se generen dos en el mismo milisegundo). Alternativas más robustas para otros contextos: un contador incremental (pero requiere recordar el último id usado, incluso entre sesiones) o `crypto.randomUUID()` (viene incluido en Node/Electron, ideal si algún día se generan muchos ids a la vez o en distintos sistemas). Para esta app (un solo admin, clicks manuales), `Date.now()` es suficiente y más simple de leer.

### Agregar un elemento a un array: `.push(...)`
Agrega un elemento al final de un array, MODIFICANDO el array original (no devuelve uno nuevo):
```js
clienteActivo.misiones.push(nuevaMision);
```

### Quitar un elemento de un array por condición: `.filter(...)`
Devuelve un **nuevo** array con solo los elementos que cumplen la condición — es la misma herramienta que ya se usa para el buscador de clientes, aplicada aquí para "quedarme con todas las misiones EXCEPTO la que tiene tal id":
```js
clienteActivo.misiones = clienteActivo.misiones.filter((mision) => mision.id !== id);
```
⚠️ Hay que reasignar el resultado (`clienteActivo.misiones = ...`) — `.filter()` no modifica el array original como sí lo hace `.push()`.

### `dataset` siempre da strings — cuidado al comparar con números
```js
const id = Number(boton.dataset.id); // convertir antes de comparar con mision.id (que es un número)
```
Si comparas un string contra un número con `!==`/`===`, la comparación puede no dar el resultado esperado por la diferencia de tipo.

### ⚠️ Esto NO tiene memoria persistente todavía
Todo lo que agregas/eliminas en el notario (y en general, cualquier cambio hecho desde `render.js`) vive solo en variables de JavaScript en RAM, mientras la app está abierta. Al cerrar la ventana o recargar, se pierde — porque `main.js` sigue mandando el mismo array hardcoded de siempre en cada arranque. La persistencia real llega cuando se conecte Google Drive API (guardando los datos como archivos reales, con lógica explícita de "cuándo guardar" en cada acción del CRUD).

---

## 🔐 Autenticación OAuth2 con Google Drive API

### Google Auth Platform (interfaz nueva de Google Cloud Console)
Google renombró/reorganizó lo que antes era "Pantalla de consentimiento OAuth". Ahora vive bajo **"Google Auth Platform"**, con secciones separadas en el menú lateral: **Overview** (métricas/verificación, informativo), **Información de la marca** (nombre de la app, correo de soporte — antes parte de la pantalla de consentimiento), **Público** (tipo Externo/Interno + usuarios de prueba), **Clientes** (aquí se crean las credenciales OAuth2), **Acceso a los datos** (scopes).

### Client ID tipo "Aplicación de escritorio" (Desktop app)
Para apps de Electron, el tipo de cliente OAuth correcto es "Aplicación de escritorio" — no "Aplicación web", porque no hay un dominio público fijo. Google entrega un archivo JSON con la clave raíz `installed` (no `web`):
```json
{ "installed": { "client_id": "...", "client_secret": "...", "redirect_uris": ["http://localhost"], ... } }
```
Solo se necesitan `client_id`, `client_secret` y (con matices, ver abajo) `redirect_uris` — el resto de los campos (`token_uri`, `auth_uri`, `project_id`, etc.) los maneja internamente la librería `googleapis`, no hay que leerlos a mano.

### ⚠️ El `redirect_uri` de apps de escritorio NO trae puerto — hay que fijarlo en el código
Google, para clientes tipo "Desktop app", permite usar cualquier puerto en `http://localhost` sin registrarlo de antemano en la consola — por eso el JSON descargado trae `"redirect_uris": ["http://localhost"]`, sin puerto. **Pero la petición de autorización sí necesita el puerto explícito.** Si se usa `redirect_uris[0]` tal cual (sin puerto), Google redirige a `http://localhost` (puerto 80 por defecto), mientras el servidor local escucha en otro puerto (ej: 3000) → `ERR_CONNECTION_REFUSED`.
**Solución:** definir manualmente el redirect URI con el puerto, y usar ESA constante (no `redirect_uris[0]`) al crear el cliente OAuth2:
```js
const REDIRECT_URI = "http://localhost:3000";
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
```

### El flujo completo de autenticación (apps de escritorio, "loopback IP flow")
1. La app genera una URL de autorización (`oAuth2Client.generateAuthUrl(...)`) con los scopes necesarios.
2. Levanta un servidor HTTP temporal en el puerto elegido (`http.createServer(...)`, `server.listen(puerto, ...)`).
3. Abre esa URL en el navegador del sistema (`shell.openExternal(authUrl)` — módulo `shell` de Electron).
4. El usuario acepta los permisos en la pantalla de Google.
5. Google redirige el navegador a `http://localhost:PUERTO/?code=...`.
6. El servidor temporal recibe esa petición, extrae `code` de la URL (`new URL(req.url, "http://localhost:PUERTO")`, luego `.searchParams.get("code")`).
7. Se responde al navegador (`res.end(...)`) y se cierra el servidor (`server.close()`) — antes de intercambiar el código por el token, para no dejar al navegador esperando si ese intercambio falla.
8. Se intercambia el `code` por tokens (`await oAuth2Client.getToken(code)` → devuelve `{ tokens }`, plural) y se aplican con `oAuth2Client.setCredentials(tokens)`.

### `autenticar()` — por qué DEBE envolverse en `new Promise(...)`
```js
function autenticar() {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/drive.file",
    });

    const server = http.createServer(async (req, res) => {
      const urlParams = new URL(req.url, REDIRECT_URI);
      const code = urlParams.searchParams.get("code");

      if (!code) {
        res.end();
        return;
      }

      res.end("Autenticación completa...");
      server.close();

      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      resolve(tokens);
    });

    server.listen(3000, () => {
      shell.openExternal(authUrl);
    });
  });
}
```
Si la función no devuelve una `Promise`, `resolve` no existe en ningún lado (no truena porque el código que lo usa está dentro de un callback que solo se ejecuta cuando llega una petición HTTP — y sin `server.listen(...)`, nunca llega ninguna). El síntoma real: `await autenticar()` no espera nada, sigue de largo con `tokens = undefined`, y `JSON.stringify(undefined)` da `undefined` (no un string), lo que revienta `fs.writeFileSync` con `TypeError: ... Received undefined`. Este bug puede quedar escondido mucho tiempo si ya existe un `token-google.json` válido (la rama `else` con `autenticar()` nunca se ejecuta) — se expone recién cuando se borra el token o expira (ver `invalid_grant`).

### Persistencia del token — no repetir el login cada vez
Patrón de "si existe, úsalo; si no, autentica":
```js
async function obtenerToken() {
  if (fs.existsSync(RUTA_TOKEN)) {
    const tokenGuardado = JSON.parse(fs.readFileSync(RUTA_TOKEN, "utf-8"));
    oAuth2Client.setCredentials(tokenGuardado);
  } else {
    const tokens = await autenticar();
    fs.writeFileSync(RUTA_TOKEN, JSON.stringify(tokens));
  }
}
```
Se llama con `await` dentro de `app.whenReady()`, antes de `createWindow()` — la app necesita el token listo antes de poder hacer cualquier llamada a Drive.

### Seguridad: qué NO debe subirse a git
`credenciales.json` (client_id/secret) y `token-google.json` (token real de acceso al Drive del usuario) van en `.gitignore`. Sintaxis de `.gitignore`: las carpetas llevan `/` al final por claridad (`node_modules/`), los archivos necesitan el nombre completo con extensión exacta (`credenciales.json`, no `credenciales`) — git compara el nombre completo, no hace coincidencia parcial.

### Modo "Prueba" vs. publicar la app
Mientras el proyecto de Google Cloud esté en modo "Prueba" (Testing) y la cuenta esté agregada como "usuario de prueba", no hace falta comprar dominio ni pasar verificación — funciona indefinidamente para un caso de un solo usuario/administrador. La única letra pequeña: en modo prueba, con scopes sensibles (como Drive completo), el token de refresco puede expirar cada cierto tiempo, pidiendo repetir el login manual ocasionalmente. Publicar la app (para evitar eso) requeriría: dominio propio verificado (vía Search Console), página de inicio pública describiendo la app, política de privacidad en ese mismo dominio, y pasar revisión de Google — queda pendiente para el final del proyecto.

### `obtenerCarpetaRaiz()` — patrón "buscar antes de crear", aplicado a Drive
Mismo principio que `obtenerToken()` (si existe, úsalo; si no, créalo), aplicado ahora a una carpeta de Drive en vez de un archivo local:
```js
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
    resource: { name: "Junta Abogados - Sistema", mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });

  return nuevaCarpeta.data.id;
}
```
- `google.drive({ version: "v3", auth: oAuth2Client })` — crea el "cliente de Drive" que se usa para TODAS las operaciones futuras (listar, crear, subir, etc.), reutilizando la autenticación ya hecha.
- `drive.files.list({ q: "..." })` — busca/consulta archivos existentes. El parámetro `q` es un mini lenguaje de búsqueda propio de Drive (similar a SQL simplificado).
- `drive.files.create({ resource: {...} })` — crea un archivo/carpeta nuevo. `resource` describe qué se va a crear.
- `mimeType: "application/vnd.google-apps.folder"` — el tipo fijo que Google usa siempre para identificar carpetas (a diferencia de archivos normales, que varían: `application/pdf`, `image/jpeg`, etc.)

### Error `invalid_grant` — el token de refresco dejó de ser válido
Puede pasar en modo prueba (Google expira tokens con scopes sensibles cada cierto tiempo) o si se recrea el cliente OAuth en Google Cloud Console (invalida tokens emitidos con el cliente anterior). **Solución:** borrar `token-google.json` y volver a correr la app — entra al camino del `else` en `obtenerToken()` y regenera un token válido pidiendo login de nuevo.

### El servidor temporal puede recibir peticiones "fantasma" sin `code`
Los navegadores a veces piden automáticamente `/favicon.ico` como petición aparte al mismo servidor — esa petición no trae `?code=...`, y si no se valida, `oAuth2Client.getToken(null)` truena. Solución simple: cortar temprano si no hay código.
```js
const code = urlParams.searchParams.get("code");
if (!code) {
  res.end();
  return; // ignora peticiones sin código, no intenta pedir un token con null
}
```

### Decisión de arquitectura: cómo se guardan los clientes en Drive
Dos enfoques posibles — se eligió el **B**:
- **Opción A (carpeta por cliente, sin índice)**: cada cliente es una carpeta con un `metadata.json` adentro. Cargar la lista completa de clientes requiere una llamada a la API por cada cliente (lento a escala).
- **Opción B (índice central, elegida)**: un solo archivo `clientes.json` con todos los clientes (nombre, identificación, referencia a su carpeta de documentos), y las carpetas de documentos aparte. Cargar la lista es una sola llamada, sin importar cuántos clientes haya. Es el mismo concepto que el array `clientes` hardcoded que ya existía en `main.js`, solo que ahora persistido como archivo en Drive en vez de vivir solo en RAM.

### Barra de progreso simple en consola
Para no perder de vista en qué paso va el arranque de la app (sobre todo mientras se espera la autenticación en el navegador), una función simple de logging con porcentaje:
```js
function progreso(porcentaje, mensaje) {
  console.log(`[${porcentaje}%] ${mensaje}`);
}
```
Se llama en cada etapa clave del arranque (`app.whenReady()`, dentro de `obtenerToken()`, etc.), pasando siempre el mismo tipo de dato (número, sin el símbolo `%`, ya que la función lo agrega en el template literal) — mezclar `progreso(20, ...)` con `progreso("20%", ...)` en distintos lugares duplica el símbolo en la salida.

### `requestBody` vs `resource` en `drive.files.create()`
`resource` es el nombre viejo del parámetro; `requestBody` es el actual y el que muestra la documentación oficial hoy. La librería sigue aceptando `resource` por compatibilidad (por eso `obtenerCarpetaRaiz()` no truena), pero para código nuevo se usa `requestBody`. Pendiente menor: unificar `obtenerCarpetaRaiz()` a `requestBody` también.

### `respuesta.data` con `alt: "media"` — ya viene parseado si el archivo es JSON válido
`drive.files.get({ fileId, alt: "media" })` descarga el contenido del archivo (no su metadata). Por debajo, la librería usa `axios`/`gaxios` con `responseType: "json"` por defecto — si el contenido es JSON válido, `respuesta.data` llega ya como objeto/arreglo de JS, **sin necesitar `JSON.parse()`**. Esto es específico de cuando el archivo realmente es JSON (que es el caso de `clientes.json`, porque su contenido lo controla la propia app).

### `JSON.stringify()` — el opuesto de `JSON.parse()`
No es un método de Drive ni de arreglos — es un método base de JS (`JSON.stringify(valor)`), que convierte un objeto/arreglo de JS en un string con forma de JSON. Se usa para mandar contenido como `body` de un `media` al crear o actualizar un archivo en Drive (Drive espera texto, no un objeto JS directo):
```js
media: {
  mimeType: "application/json",
  body: JSON.stringify(listaClientes),
}
```

### Buscar si un elemento existe en un arreglo: `.find()` vs `.some()`
Ambos recorren un arreglo con una función que compara cada elemento y devuelve `true`/`false`. `.find()` devuelve el **elemento completo** que cumple (o `undefined`); `.some()` devuelve directamente un **booleano**. Para validar duplicados (¿ya existe un cliente con esta identificación?), cualquiera de los dos sirve:
```js
const yaExiste = listaClientes.find((cliente) => {
  return cliente.tipoIdentificacion === tipoIdentificacion && cliente.identificacion === identificacion;
});
```
⚠️ Con arrow functions que usan `{ }`, el `return` es obligatorio — sin llaves (`(cliente) => cliente.id === id`), el `return` es implícito.

### `drive.files.update()` — sobreescribir contenido de un archivo existente
A diferencia de `.create()` (que necesita `parents` para saber DÓNDE crear algo nuevo), `.update()` necesita `fileId` para saber QUÉ archivo ya existente modificar — no lleva `parents` porque no se está moviendo el archivo, solo cambiando su contenido:
```js
await drive.files.update({
  fileId: idArchivo,
  media: { mimeType: "application/json", body: JSON.stringify(listaClientes) },
});
```

### `try { } catch (error) { }` — manejar errores sin tumbar la app
Si algo dentro de `try` lanza un error (`throw new Error("...")`), la ejecución salta directo a `catch (error)`, sin tumbar el resto de la app. `error.message` da el texto que se le puso al `throw`. Se pueden distinguir distintos tipos de error dentro del mismo `catch` con un `if` comparando `error.message` (solución simple); a futuro, con más tipos de error, conviene usar clases de error personalizadas (`class MiError extends Error {}` + `error instanceof MiError`) en vez de comparar strings.

### Patrón ETL (Extract, Transform, Load) aplicado a "crear cliente"
No se necesita una herramienta de ETL dedicada (es sobre-ingeniería para una app de un solo administrador) — el patrón sirve como **forma de pensar** la función `crearCliente()`:
- **Extract**: recibir `datosCliente` (objeto con `nombre`, `tipoIdentificacion`, `identificacion`, `descripcionCaso`), desde el admin por ahora, desde el formulario web más adelante.
- **Transform**: validar que no exista ya un cliente con esa `identificacion` + `tipoIdentificacion` (con `.find()`), armar el objeto final del cliente con la estructura estándar (`archivosInfo: []`, `archivosDatos: []`, `misiones: []`).
- **Load**: crear la carpeta del cliente en Drive (`crearCarpetaCliente()`) + guardar el índice actualizado (`actualizarClientesJson()`).
Pensar la función en estas 3 etapas separadas facilita conectar el formulario web después — solo cambiaría el "Extract", el resto no se toca.

### Scopes de Google Drive API — niveles de sensibilidad
Google clasifica los scopes en 3 niveles: **no sensible** (`drive.file` — solo archivos que la app misma creó, o que el usuario compartió vía Google Picker), **sensible** (`drive.apps.readonly`), **restringido** (`drive` — acceso total al Drive del usuario). Se eligió `drive.file` para este proyecto: la app siempre crea sus propios archivos/carpetas (nunca necesita listar archivos ajenos del usuario), y evita la auditoría de seguridad CASA Tier 2 que exige el scope `drive` al momento de publicar la app. Nota: el límite de 7 días de expiración del refresh token en modo "Prueba" (Testing, tipo Externo) aplica **igual** con cualquier scope no básico — cambiar a `drive.file` no lo evita, pero sí simplifica muchísimo el trámite de verificación para salir de modo Prueba en el futuro.

### Módulos de Node.js — dividir un archivo grande en varios
Cada archivo `.js` es un módulo independiente con su propio scope: nada de lo declarado ahí (funciones, variables) es visible desde otro archivo a menos que se exporte explícitamente. Dos piezas:
```js
// drive.js — exportar al final del archivo
module.exports = { obtenerCarpetaRaiz, obtenerClientesJson, crearCliente, crearCarpetaCliente, actualizarClientesJson };
```
```js
// main.js — importar con ruta relativa (empieza con "./")
const { obtenerCarpetaRaiz, crearCliente } = require("./drive.js");
```
Mismo mecanismo que ya se usaba con paquetes de npm (`require("electron")`), solo que apuntando a un archivo propio en vez de un paquete instalado. Cada archivo pide (`require`) únicamente lo que de verdad usa — no hay problema en que dos archivos distintos hagan cada uno su propio `require("path")` o `require("electron")`, aunque sea el mismo paquete.

### División elegida para este proyecto
- **`auth.js`**: todo lo de autenticación — `require("electron")` (solo `{shell}`), `require("googleapis")`, `require("fs")`, `require("path")`; las variables `credenciales`, `client_id`, `client_secret`, `REDIRECT_URI`, `oAuth2Client`, `RUTA_TOKEN`; las funciones `autenticar()` y `obtenerToken()`. Exporta `{ oAuth2Client, obtenerToken }`.
- **`drive.js`**: todas las funciones de Drive (`obtenerCarpetaRaiz`, `obtenerClientesJson`, `crearCliente`, `crearCarpetaCliente`, `actualizarClientesJson`). Importa `{ oAuth2Client }` desde `./auth.js`, y `{ google }` desde `googleapis` directamente (lo necesita para `google.drive({ auth: oAuth2Client })` en cada función).
- **`main.js`**: solo lo esencial de Electron — `require("electron")` (con `{app, BrowserWindow, ipcMain}`, sin `shell`), `require("path")`, `{ obtenerToken }` desde `./auth.js`, y las 5 funciones de `./drive.js`. Contiene `createWindow()`, `app.whenReady()`, y los `ipcMain.handle(...)`.
Criterio para decidir dónde va cada línea del encabezado original: preguntarse "¿quién usa esto?" — si solo lo usa autenticación, va en `auth.js`; si solo lo usa Electron/ventanas, se queda en `main.js`; si lo usan varias funciones de Drive, va en `drive.js`.

### Reorganización en carpetas — dos "mundos" separados, no una carpeta única
Node no exige estructura de carpetas, pero hay dos mecanismos de referencia DISTINTOS que hay que respetar al mover archivos:
- **Proceso *main* (Node)**: usa `__dirname` + `path.join(...)` + `require(...)`. Archivos: `main.js`, `auth.js`, `drive.js`, `preload.js`, `credenciales.json`. En este proyecto viven en `app/`.
- **Proceso *renderer* (navegador)**: usa rutas de navegador normales (`<script src="render.js">`), relativas a dónde vive `index.html` — **no** usa `__dirname` ni `require` de Node (por `contextIsolation: true`). Archivos: `index.html`, `render.js`. En este proyecto viven en `renderer/`.
Regla práctica: mover cada archivo **junto con los que ya lo acompañaban** según cuál de los dos mecanismos usa — mezclar los dos mundos en una sola carpeta rompe las referencias de forma confusa (ej: mover `render.js` sin `index.html`, o `credenciales.json` sin `main.js`).

### `path.join(__dirname, "..", "carpeta", "archivo.ext")` — subir un nivel de carpeta
`".."` dentro de `path.join(...)` significa "la carpeta de arriba" — se usa como un elemento más de la ruta, sin necesitar barras (`path.join` ya las agrega solo; escribir `"carpeta/"` con barra puede generar una doble barra). Ejemplos reales de este proyecto, tras mover `main.js`/`auth.js` a `app/` y `token-google.json`/`index.html` a otro lado:
```js
// auth.js (vive en app/), token-google.json se quedó en la raíz
const RUTA_TOKEN = path.join(__dirname, "..", "token-google.json");

// main.js (vive en app/), index.html vive en renderer/
win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
```
⚠️ `win.loadFile(...)` carga el **HTML** (lo que ve la ventana), nunca un `.js` directamente — `render.js` se carga solo, indirectamente, porque `index.html` lo referencia con `<script src="render.js">`.

### `package.json` — el campo `"main"` debe apuntar a la nueva ubicación
Le dice a Electron cuál archivo arrancar primero. Si `main.js` se mueve a `app/main.js`, este campo tiene que actualizarse a `"main": "app/main.js"` — si no, Electron no encuentra el punto de entrada.

### Funciones "huérfanas" al dividir en módulos — utilidades genéricas usadas por varios archivos
Al dividir, cualquier función que **no pertenezca exclusivamente** a uno de los archivos nuevos (ej: `progreso(porcentaje, mensaje)`, que se llamaba tanto desde `app.whenReady()` en `main.js` como desde `obtenerToken()` en `auth.js`) revienta con `ReferenceError: nombreFuncion is not defined` en el archivo que la llama pero no la declara. Dos soluciones: crear un archivo compartido (ej: `utils.js`) que ambos importen, o (si la función es prescindible, como era el caso de `progreso()`, que solo hacía logging de conveniencia) eliminarla por completo — pero hay que borrar **todas** sus llamadas en **todos** los archivos, no solo donde truena primero, o vuelve a aparecer el mismo error en otro lugar.

### Migración de llave de búsqueda: `identificacion + tipoIdentificacion` → `UUID` interno
Decisión: usar `crypto.randomUUID()` (nativo de Node, sin instalar nada) como identificador interno (`UUID`) generado una sola vez en `crearCliente()`, en vez de usar `identificacion + tipoIdentificacion` como llave de búsqueda. Razón: `identificacion`/`tipoIdentificacion` son datos reales del cliente que pueden cambiar con el tiempo (ej: alguien pasa de Cédula de Extranjería a Cédula de Ciudadanía) — si son la llave de búsqueda, cambiar el dato real rompe la referencia al registro. Con `UUID` interno, el cliente nunca cambia de identidad dentro del sistema, sin importar qué pase con sus datos reales.
```js
const { randomUUID } = require("crypto"); // en el encabezado del archivo
...
UUID: randomUUID(), // dentro del objeto clienteNuevo, en crearCliente()
```
**Importante — esto NO reemplaza la validación de duplicados de `crearCliente()`**: son preguntas distintas. `UUID` identifica un registro dentro del sistema; la validación de `identificacion + tipoIdentificacion` pregunta "¿ya existe una persona real con esta cédula?". Ambas siguen siendo necesarias.
**Consecuencia**: como `identificacion`/`tipoIdentificacion` pasaron a ser campos **editables** (igual que `nombre`), `actualizarCliente()` necesita su propia validación de duplicados — pero excluyendo al propio cliente que se está actualizando (si no, siempre "se encontraría a sí mismo" y nunca dejaría actualizar nada):
```js
const conflicto = listaClientes.find((cliente) => {
  return (
    cliente.UUID !== UUID &&  // excluir al cliente que se está actualizando
    cliente.tipoIdentificacion === (datosActualizados.tipoIdentificacion || listaClientes[posicion].tipoIdentificacion) &&
    cliente.identificacion === (datosActualizados.identificacion || listaClientes[posicion].identificacion)
  );
});
```

### `.findIndex()` vs `.find()` — cuándo usar cada uno
- `.find()` devuelve el **elemento completo** (u `undefined`) — útil cuando solo necesitas leer datos del elemento encontrado (ej. `cliente.idCarpeta` antes de borrar su carpeta).
- `.findIndex()` devuelve la **posición numérica** (o `-1` si no hay match) — útil cuando necesitas **modificar** el elemento directamente dentro del arreglo original: `listaClientes[posicion].campo = nuevoValor`.
⚠️ `.findIndex()` devuelve `-1` (no `undefined`) cuando no encuentra nada — el `if` de chequeo debe comparar explícitamente contra `-1` (`if (posicion === -1)`), no usar negación con `!`, porque `-1` es *truthy* en JS (`!(-1)` da `false`, lo contrario de lo esperado).

### Patrón "actualizar solo lo que venga, conservar el resto" — operador `||`
Para permitir actualizaciones parciales (ej. cambiar solo `nombre` sin borrar `descripcionCaso`), usar `||` para quedarse con el valor nuevo si viene, o el valor anterior si no:
```js
listaClientes[posicion].nombre = datosActualizados.nombre || listaClientes[posicion].nombre;
```
⚠️ Limitación conocida y aceptada para este proyecto: con `||`, un string vacío `""` también se trata como "no vino nada" (por ser *falsy*) y conserva el valor anterior — decisión consciente, porque para campos como `descripcionCaso` nunca se querría vaciar accidentalmente. Alternativa más precisa si algún día hiciera falta: comparar explícitamente `!== undefined` en vez de usar `||`.

### `idCarpeta` guardado como campo del cliente (Opción A, sobre Opción B de buscar por nombre cada vez)
Se agregó el campo `idCarpeta` al objeto cliente, capturando el resultado de `crearCarpetaCliente()` (que ya devolvía el `id`, pero se descartaba) y guardándolo en `crearCliente()`. Razón: varias funciones futuras necesitan tocar la carpeta del cliente (borrar, subir archivos) — guardar el `id` evita repetir la búsqueda por nombre cada vez, y no depende de que el nombre de la carpeta se mantenga sin cambios (que ahora sí puede cambiar, ya que `nombre`/`identificacion`/`tipoIdentificacion` son editables).
⚠️ Orden importante en `crearCliente()`: la llamada a `crearCarpetaCliente()` (capturando su resultado en `idCarpeta`) debe ocurrir **antes** de armar el objeto `clienteNuevo`, para poder usar esa variable dentro del objeto.

### Campo `estado` — tres valores de texto, no booleano
Decisión: `estado: "activo" | "papelera" | "en espera"` (string), no un booleano tipo `enPapelera: true/false`. Razón: con 3+ estados posibles, un booleano solo puede representar dos, y agregar más requeriría múltiples campos booleanos con riesgo de combinaciones inconsistentes (ej. `enPapelera: true` y `archivado: true` a la vez, sin significado claro). Con string, se agregan valores nuevos a la lista de opciones válidas sin ese riesgo.

### El trío CRUD de "papelera" — borrado suave + borrado duro con restauración
Decisión de UX (pensada para un despacho de abogados, donde perder archivos de un caso es grave): en vez de un solo `borrarCliente()`, se construyeron 3 funciones separadas:
- **`moverAPapelera(UUID, idCarpetaRaiz)`** — borrado suave: solo cambia `estado` a `"papelera"`. No toca la carpeta de Drive. Sin validación de conflicto (no aplica: no se están tocando campos como `identificacion` que puedan chocar entre clientes).
- **`restaurarCliente(UUID, idCarpetaRaiz)`** — inverso: regresa `estado` a `"activo"`. Mismo cuerpo que `moverAPapelera()`, cambiando solo el valor asignado.
- **`borrarClientePermanente(UUID, idCarpetaRaiz)`** — borrado duro, sin vuelta atrás: usa `.find()` (no `.findIndex()`, porque necesita `cliente.idCarpeta` antes de que el cliente desaparezca del arreglo) para conseguir el cliente completo, borra su carpeta en Drive con `drive.files.delete({ fileId: cliente.idCarpeta })`, y usa `.filter()` para generar un arreglo nuevo sin ese cliente:
```js
const listaActualizada = listaClientes.filter((cliente) => cliente.UUID !== UUID);
```
Pendiente de UI: esta función necesita mostrar una advertencia antes de ejecutarse, por ser irreversible. La vista de "Clientes" (activos) y la futura pestaña "Papelera" filtrarán el mismo arreglo de `clientes.json` por el campo `estado` — no son archivos ni fuentes de datos separadas.

### El patrón de 4 capas para conectar la UI con Drive (IPC de Electron)
Cualquier acción que la UI necesite ejecutar contra Drive atraviesa 4 capas, en este orden:
```
render.js (UI) → preload.js (puente) → main.js (handler) → drive.js (lógica real)
```
- **`render.js`**: llama a `window.clientesAPI.nombreFuncion(argumento)`.
- **`preload.js`**: expone esa función dentro de `contextBridge.exposeInMainWorld('clientesAPI', {...})`, reenviando a `ipcRenderer.invoke('nombreDelCanal', argumento)`. Nunca importa nada de `drive.js` directamente — solo reenvía.
- **`main.js`**: recibe con `ipcMain.handle('nombreDelCanal', async (event, argumento) => { return await funcionDeDrive(argumento, idCarpetaRaiz); })`. El nombre del canal debe coincidir EXACTO (mayúsculas incluidas) entre `preload.js` y `main.js`.
- **`drive.js`**: ejecuta la lógica real y devuelve el resultado, que viaja de vuelta por el mismo camino hasta `render.js`.

### Compartir `idCarpetaRaiz` entre `app.whenReady()` y `ipcMain.handle(...)`
`idCarpetaRaiz` se necesita tanto al arrancar la app como dentro de cada `ipcMain.handle(...)`, que vive en otro scope. Solución: declararla con `let` a nivel de archivo (sin valor), y solo asignarle el valor dentro de `app.whenReady()` (sin volver a poner `let`/`const` ahí, o se crearía una variable nueva y distinta, sin efecto real).
```js
let idCarpetaRaiz; // arriba del archivo, visible en todo main.js

app.whenReady().then(async () => {
  await obtenerToken();
  idCarpetaRaiz = await obtenerCarpetaRaiz(); // ASIGNA, sin let/const
  createWindow(); // debe ir DESPUÉS de tener idCarpetaRaiz (ver siguiente nota)
});

ipcMain.handle("darClientes", async () => {
  return await obtenerClientesJson(idCarpetaRaiz); // LEE, ya lista
});
```

### Race condition: `createWindow()` debe ir DESPUÉS de obtener `idCarpetaRaiz`
`createWindow()` no tiene ningún `await` interno — dispara la carga de `render.js` en paralelo mientras el resto de `app.whenReady()` sigue ejecutándose. Si `createWindow()` se llama antes de `idCarpetaRaiz = await obtenerCarpetaRaiz()`, `render.js` puede terminar de cargar y llamar a `iniciar()` (pidiendo la lista de clientes) antes de que `idCarpetaRaiz` tenga su valor real — resultando en una consulta a Drive con `'undefined' in parents`, un 404 confuso. Solución: asegurar que `idCarpetaRaiz` ya esté asignada antes de llamar a `createWindow()`.

### Identificar clientes en el DOM: usar `UUID`, no `identificacion`
Al dibujar cada `<li>` de un cliente, el atributo `data-id` debe guardar `cliente.UUID` (no `cliente.identificacion`, que es editable y ya no es única de forma garantizada como llave). El texto visible al usuario sí sigue mostrando `nombre`/`tipoIdentificacion`/`identificacion` normalmente — solo el atributo interno de identificación cambia.

### Filtrar por `estado` en dos lugares de la UI, no solo al listar
No basta con filtrar `estado === "activo"` al cargar la lista inicial (`iniciar()`) — el buscador tiene su propio `.filter()` independiente, y si no se le agrega también la condición de `estado`, mostraría clientes en papelera que coincidan con el texto buscado, mezclados con los activos.

### Modal de confirmación con `display: none` / `display: flex`
Para un modal centrado (fondo oscuro superpuesto), el contenedor usa `position: fixed`, cubre toda la pantalla, y usa `display: flex` + `align-items/justify-content: center` para centrar su contenido — no `display: block` como las demás vistas. Al mostrarlo desde JS, hay que escribir explícitamente `.style.display = "flex"` (no `"block"`), o el centrado no se aplica.
Patrón para "recordar" sobre qué elemento actúa el modal mientras espera confirmación: una variable global adicional (ej. `let UUIDaBorrar = null;`), asignada en el momento del click que abre el modal, usada al confirmar, y reseteada a `null` tanto al confirmar como al cancelar.

### CSS separado en su propio archivo
El CSS se movió de un bloque `<style>` inline en `index.html` a un archivo `renderer/style.css`, enlazado con `<link rel="stylesheet" href="style.css">` en el `<head>` — misma carpeta que `index.html`, así que la ruta es relativa simple, sin `__dirname` ni nada de Node (mismo mecanismo de rutas de navegador que `<script src="render.js">`).

### Migración de `render.js` a módulos ES nativos del navegador (carpeta `ui/`)
`render.js` se dividió en 5 archivos dentro de `render/ui/`, usando `import`/`export` nativos del navegador (no `require`/`module.exports`, que es específico de Node y no funciona en el proceso *renderer*):
- **`init.js`**: `export let clientes`, `iniciar()`, y la llamada final que arranca la app. Es el único archivo cargado directamente por `index.html`.
- **`lista.js`**: lista principal, buscador, listener de click que abre el detalle.
- **`detalle.js`**: detalle de cliente + misiones fusionadas (el notario solo tiene sentido junto al detalle).
- **`papelera.js`**: vista de papelera, restaurar, borrar permanente con modal.
- **`formulario.js`**: crear/editar cliente (comparten el mismo formulario, ver sección de `actualizarCliente` en UI más abajo).

### Diferencias clave de módulos ES (navegador) vs `require`/`module.exports` (Node)
- En `index.html`, el script de entrada necesita `type="module"`: `<script type="module" src="ui/init.js"></script>` — sin esto, el navegador no entiende `import`/`export` y truena.
- `import { algo } from "./archivo.js";` — el nombre del archivo SIEMPRE lleva `.js` explícito (a diferencia de `require`, que puede omitirlo), y debe coincidir exacto con el nombre real en disco.
- `import "./archivo.js";` (sin `{ }`, sin variable) — para ejecutar un archivo completo (que registre sus propios `addEventListener`) sin necesitar importar nada específico de él. Necesario para que archivos "hoja" (que no exportan nada que otros usen, como listeners de UI) se carguen igual.
- **Carga por cadena, no por lista en el HTML**: el navegador solo carga lo que el archivo de entrada (`init.js`) importa, directa o indirectamente. Si ningún archivo importa (ni con `{ }` ni sin ellas) a otro, ese otro archivo JAMÁS se ejecuta, aunque exista en disco y esté bien escrito — sus listeners nunca se registran, y sus botones no responden, sin ningún error visible en la Consola. Diagnóstico: pestaña "Sources" del DevTools muestra qué archivos realmente se cargaron.
- **Dependencias circulares SÍ funcionan** en módulos ES nativos (ej. `init.js` importa `renderizarLista` de `lista.js`, y `lista.js` importa `clientes` de `init.js`) — a diferencia de otros sistemas de módulos, esto no rompe nada aquí.
- **Live binding con `let` exportado**: al importar una variable declarada con `let` (ej. `export let clientes`), el import mantiene una conexión viva con el valor actual — si el archivo de origen reasigna la variable más adelante, todos los archivos que la importaron ven el valor actualizado automáticamente, sin volver a importar nada.
- Cada archivo tiene su propio scope real y aislado (a diferencia de cargar varios `<script>` sueltos sin `type="module"`, donde todo comparte el mismo espacio global y hay riesgo de choques de nombres silenciosos).

### CSS separado en su propio archivo
El CSS se movió de un bloque `<style>` inline en `index.html` a un archivo `renderer/style.css` (la carpeta del proyecto sigue llamándose `render/` a nivel de disco, contiene `index.html`, `style.css`, y ahora `ui/`), enlazado con `<link rel="stylesheet" href="style.css">` en el `<head>`.

### Patrón: reutilizar un mismo formulario para crear Y editar
`formulario.js` usa una variable `let UUIDenEdicion = null;` para decidir el comportamiento del mismo formulario HTML: si tiene un valor, el `submit` llama a `actualizarCliente(UUIDenEdicion, datos)`; si es `null`, llama a `crearCliente(datos)`. El botón "Editar" (en `detalle.js`, ahora movido a la lógica de `formulario.js`) pre-rellena los inputs con los datos del `clienteActivo` y cambia los textos de título/botón ("Nuevo cliente" → "Editar cliente", "Crear cliente" → "Guardar cambios"). Importante: `UUIDenEdicion` debe resetearse a `null` en el botón "Cancelar" y también al abrir "Nuevo cliente" desde cero — si no, quedaría "atorado" en modo edición.

### Debugging de módulos ES: la pestaña "Sources" del DevTools
Cuando algo no responde sin ningún error visible en "Console", revisar "Sources" para confirmar qué archivos realmente cargó el navegador — si falta alguno de la lista esperada, el problema es que ningún archivo en la cadena de imports lo está importando (ver punto de "carga por cadena" arriba).

### Persistencia real de misiones (`agregarMision`, `eliminarMision`)
Antes, las misiones solo vivían en `clienteActivo.misiones` en memoria del navegador — se perdían al cerrar la app. Se agregaron dos funciones en `drive/clientes.js`, mismo patrón que `actualizarCliente()` (buscar por `UUID` con `findIndex`, modificar, guardar con `actualizarClientesJson()`):
```js
async function agregarMision(UUID, textoMision, idCarpetaRaiz) {
  // findIndex + listaClientes[posicion].misiones.push({ id: Date.now(), texto: textoMision }) + guardar
}
async function eliminarMision(UUID, idMision, idCarpetaRaiz) {
  // findIndex + listaClientes[posicion].misiones = misiones.filter(m => m.id !== idMision) + guardar
}
```
En `render/ui/detalle.js`, los listeners de `btnAgregarMision`/`listaMisiones` ya no modifican `clienteActivo.misiones` directamente — llaman a `window.clientesAPI.agregarMision/eliminarMision(...)` y **reemplazan** `clienteActivo` completo con el resultado que devuelve el backend (que ya viene actualizado desde Drive), en vez de mutar el objeto en memoria.

### Reorganización de `drive.js` → carpeta `app/drive/`
Cuando la subida de archivos introdujo un tema de responsabilidad distinto al de "operaciones sobre clientes", se dividió: `drive.js` (renombrado a `app/drive/clientes.js`) y `app/drive/archivos-local.js` (nuevo, subida/borrado de archivos). Criterio: dividir por responsabilidad real cuando aparece, no por conteo de líneas ni por adelantado. `archivos-local.js` importa `{ obtenerClientesJson, actualizarClientesJson }` desde `./clientes.js`, y `{ oAuth2Client }` desde `../auth.js` (una carpeta arriba, por el nivel extra de anidamiento).

### Subida de archivos locales — `dialog.showOpenDialog`, un flujo distinto a los demás IPC
A diferencia de todas las funciones anteriores (donde `render.js` manda datos ya armados), aquí es **`main.js`** quien decide cómo conseguir el dato (la ruta del archivo), usando el módulo `dialog` de Electron — `render.js` solo pide "quiero subir algo para este cliente, en esta pestaña", sin mandar ninguna ruta:
```js
const { dialog } = require("electron"); // agregado al require("electron") de main.js

ipcMain.handle("subirArchivoLocal", async (event, UUID, tipoPestana) => {
  const resultado = await dialog.showOpenDialog({ properties: ["openFile", "multiSelections"] });
  if (resultado.canceled) return null;

  let clienteActualizado;
  for (const rutaArchivo of resultado.filePaths) { // for...of con await: secuencial, evita condición de carrera
    clienteActualizado = await subirArchivoLocal(UUID, rutaArchivo, tipoPestana, idCarpetaRaiz);
  }
  return clienteActualizado;
});
```
`subirArchivoLocal()` en `archivos-local.js`: usa `path.basename(rutaArchivo)` para el nombre limpio (sin la ruta completa), `fs.createReadStream(rutaArchivo)` como `body` del `media` (lee el archivo en streaming, eficiente para archivos grandes), sube a `parents: [listaClientes[posicion].idCarpeta]` (la carpeta del CLIENTE, no `idCarpetaRaiz`), y guarda en el arreglo correspondiente (`archivosInfo`/`archivosDatos`) un objeto `{ nombre, idArchivo }` — no solo el nombre, para poder borrar/descargar el archivo individual después.

### Borrado de archivos — más simple que subir, sin `dialog`
`eliminarArchivo()` no necesita preguntarle nada al usuario (el `idArchivo` ya se conoce desde el HTML, en un `data-id`) — mismo patrón simple que `moverAPapelera`/`eliminarMision`. **Decisión clave tras depurar un bug real**: la función NO recibe `tipoPestana` — busca y filtra en **ambos** arreglos (`archivosInfo` Y `archivosDatos`), sin necesitar saber de cuál pestaña viene, evitando que un desajuste entre la pestaña "activa" en la UI y la pestaña real del archivo deje una referencia huérfana sin borrar.
```js
async function eliminarArchivo(UUID, idArchivo, idCarpetaRaiz) {
  // ...
  try {
    await drive.files.delete({ fileId: idArchivo });
  } catch (error) {
    if (error.code !== 404) throw error; // si ya no existe en Drive, seguimos limpiando la referencia igual
  }
  listaClientes[posicion].archivosInfo = listaClientes[posicion].archivosInfo.filter(a => a.idArchivo !== idArchivo);
  listaClientes[posicion].archivosDatos = listaClientes[posicion].archivosDatos.filter(a => a.idArchivo !== idArchivo);
  await actualizarClientesJson(listaClientes, idCarpetaRaiz);
  return listaClientes[posicion];
}
```

### Lecciones del bug largo de "borrar archivo" (varias causas mezcladas)
1. **Condición de carrera entre operaciones concurrentes**: si dos llamadas a Drive (ej. subir + borrar, o dos borrados) corren en paralelo, ambas leen la misma versión vieja de `clientes.json` antes de que la primera termine de guardar — la segunda en guardar sobreescribe el trabajo de la primera, dejando referencias "fantasma" a archivos ya borrados de Drive. Solución: una bandera `operacionEnCurso` en el archivo de UI (`detalle.js`) que bloquea nuevas acciones de archivo mientras una está en curso, reseteada en un bloque `finally` para garantizar que nunca quede "atorada" en `true`:
```js
let operacionEnCurso = false;
// dentro de cada listener relevante:
if (operacionEnCurso) return;
operacionEnCurso = true;
try { /* ... */ } finally { operacionEnCurso = false; }
```
2. **Deshabilitar el botón clickeado** (`boton.disabled = true`, de forma síncrona, ANTES de cualquier `await`) previene el doble-click sobre el mismo elemento — complementario a la bandera global, no sustituto (la bandera cubre botones *distintos* corriendo casi al mismo tiempo).
3. **Desajuste de firma entre capas al refactorizar**: al quitar `tipoPestana` de `eliminarArchivo()` en `drive.js`, hay que actualizarlo en LAS 4 capas (`drive.js`, `preload.js`, `main.js`, `render.js`) — dejar una sola capa desactualizada no da un error claro; JS asigna argumentos por posición sin quejarse, así que un parámetro sobrante/faltante desplaza silenciosamente los siguientes (ej: `idCarpetaRaiz` recibiendo por error el valor de `tipoPestana`, generando un error confuso de "carpeta no encontrada" que no menciona el verdadero problema).
4. **Procesos de Electron "fantasma"**: si la app no se cierra limpiamente (crash silencioso, cerrar solo la ventana), puede quedar un proceso `electron.exe` de fondo ejecutando código VIEJO, aunque el archivo en disco ya esté corregido — genera errores que no coinciden con el código que se está mirando. Diagnóstico: Administrador de tareas → pestaña Detalles/Procesos → buscar más de un `electron.exe` → finalizar todos → volver a correr `npm start`.

---

## 🛠️ Entorno de desarrollo — Troubleshooting (Windows)

### ¿Qué es el PATH?
Una lista de carpetas donde el sistema operativo busca automáticamente los programas que escribes en la terminal (`npm`, `node`, `nvm`, etc.). Si un programa está instalado pero su carpeta no está en el PATH, el sistema dice "no se reconoce como un comando" aunque el archivo exista.

### Variables de usuario vs. variables del sistema
- **Variables de usuario**: solo afectan tu cuenta, no necesitas ser administrador para editarlas.
- **Variables del sistema**: afectan a todos los usuarios, requieren permisos de administrador.
- Si una variable existe en ambos lados, **la de usuario tiene prioridad** (gana sobre la del sistema).

### Cómo abrir el editor de variables de entorno rápido
`Win + R` → escribir `rundll32.exe sysdm.cpl,EditEnvironmentVariables` → Enter.

### Espacios en rutas = problemas
Carpetas con espacios en el nombre (ej: `C:\Users\ADN 27\`) pueden romper herramientas de línea de comandos mal escritas, porque el sistema puede interpretar la ruta como dos argumentos separados. Prefiere instalar herramientas de desarrollo en rutas cortas y sin espacios (ej: `C:\nvm4w`).

### nvm (Node Version Manager) guarda su config en un archivo, no solo en variables de entorno
`nvm-windows` lee de un archivo `settings.txt` (dentro de su carpeta de instalación) con las líneas `root:` y `path:`. Si reinstalas o mueves cosas, revisa que ese archivo apunte a las rutas correctas — a veces sobrevive con datos viejos aunque hayas cambiado las variables de entorno.

### Después de cambiar el PATH o variables de entorno
Los cambios **no aplican a terminales ya abiertas** — hay que cerrarlas y abrir una nueva (o reiniciar la PC en casos tercos) para que tomen efecto.

---

## 📍 Estado actual del proyecto (última actualización: sesión de autenticación OAuth2)

### Completado
- Proyecto Electron inicializado y funcionando (`main.js`, `render.js`, `preload.js`, `index.html`)
- Lista de clientes renderizada dinámicamente (con datos hardcoded en `main.js`, no reales todavía)
- Sistema de filtrado/búsqueda funcionando correctamente (por nombre e identificación)
- IPC funcionando de punta a punta: `preload.js` expone `clientesAPI.obtenerClientes()`, `main.js` responde vía `ipcMain.handle("darClientes", ...)`, `render.js` lo consume con `await` dentro de una función `iniciar()`
- Estructura de datos del cliente actualizada: `{ nombre, tipoIdentificacion, identificacion, archivosInfo, archivosDatos, misiones }`
- `index.html` actualizado con dos vistas (`#vista-lista` y `#vista-detalle`), estructura de pestañas (`.tab[data-tab]`, `#detalle-contenido`), y el widget flotante del notario (`#notario`, `#lista-misiones`, `#input-mision`, `#btn-agregar-mision`)
- `data-id` agregado a cada `<li>` de la lista, para poder identificar el cliente al hacer click
- Navegación completa lista → detalle → volver, funcionando (delegación de eventos, `mostrarDetalle()`, `btnVolver`)
- Pestañas "Información del cliente" / "Datos añadidos" funcionando con datos de prueba, usando el patrón `clienteActivo` + `mostrarPestaña()`
- Sistema de misiones ("el notario") funcionando en memoria: agregar (`.push`) y eliminar (`.filter`) misiones por cliente, con `Date.now()` como id — sin persistencia todavía (se resetea al cerrar la app)
- Proyecto configurado en Google Cloud Console: proyecto creado, API de Drive habilitada, Google Auth Platform configurado (marca + público + usuario de prueba agregado), credenciales OAuth2 tipo "Desktop app" creadas y descargadas (`credenciales.json`)
- **Autenticación OAuth2 con Google Drive funcionando de punta a punta**: flujo completo de "loopback IP" (servidor local temporal en puerto 3000, apertura del navegador, intercambio de código por token), con el fix del `redirect_uri` con puerto explícito. Token persistido en `token-google.json`, con lógica de "usar si existe, autenticar si no" en `obtenerToken()`
- `.gitignore` configurado con `node_modules/`, `credenciales.json`, `token-google.json`
- Barra de progreso simple en consola (`progreso(porcentaje, mensaje)`) durante el arranque de la app
- Entorno de desarrollo (Node/npm/nvm) reinstalado y estabilizado tras problemas de PATH

### Completado (continuación, sesión de carpeta raíz en Drive)
- Primera llamada real a la API confirmada (`listarArchivosDePrueba()`, ahora comentada como herramienta de diagnóstico para el futuro)
- Confirmado que reabrir la app no vuelve a pedir login (token persiste correctamente)
- `obtenerCarpetaRaiz()` funcionando: busca (o crea la primera vez) una carpeta dedicada "Junta Abogados - Sistema" en la raíz del Drive del usuario — ahí va a vivir todo lo de la app, sin mezclarse con archivos personales
- Manejo del error `invalid_grant` (token de refresco inválido) diagnosticado y resuelto (borrar `token-google.json` y reautenticar)
- Fix del error cosmético de peticiones sin `code` (ej: `favicon.ico`) en el servidor temporal de autenticación
- Decisión de arquitectura tomada: Opción B (índice central `clientes.json` + carpetas de documentos aparte) para representar clientes en Drive

### Completado (continuación, sesión de crearCliente)
- **Bug crítico en `autenticar()` diagnosticado y corregido**: no devolvía una `Promise`, no generaba `authUrl`, nunca llamaba a `server.listen(...)`, ni abría el navegador — quedó expuesto al borrar/expirar el token, porque mientras existió un token válido esta rama de código nunca se ejecutó. Reescrita completa: `new Promise((resolve, reject) => {...})` + `generateAuthUrl` + `server.listen(3000, ...)` + `shell.openExternal(authUrl)`.
- **Scope cambiado de `drive` (restringido) a `drive.file` (no sensible)** — evita la auditoría CASA Tier 2 al publicar la app; requirió reautenticar (el scope viejo ya no aplicaba).
- `obtenerClientesJson(idCarpetaRaiz)` completa: busca `clientes.json` dentro de la carpeta raíz; si existe, descarga y devuelve su contenido ya parseado (`respuesta.data`, sin `JSON.parse()` manual); si no existe, lo crea con `[]` y lo devuelve.
- `crearCliente(datosCliente, idCarpetaRaiz)` completa, con el patrón ETL: valida duplicados por `identificacion` + `tipoIdentificacion` (`.find()`), arma el objeto del cliente nuevo (incluye `descripcionCaso` como campo directo — decisión: no va en `archivosInfo`, que se reserva para archivos, no texto libre), crea la carpeta del cliente y guarda el índice actualizado.
- `crearCarpetaCliente(nombre, identificacion, tipoIdentificacion, idCarpetaRaiz)` — crea (o reutiliza si ya existe) la carpeta del cliente en Drive, con nombre `"{nombre} - {tipoIdentificacion} - {identificacion}"` para evitar colisiones entre clientes con el mismo nombre.
- `actualizarClientesJson(listaClientes, idCarpetaRaiz)` — sobreescribe `clientes.json` en Drive con `drive.files.update()` (a diferencia de `.create()`, usa `fileId` en vez de `parents`).
- Probado de punta a punta con un cliente de prueba hardcoded en `app.whenReady()`: se creó la carpeta del cliente (vacía, como se esperaba — todavía no hay función de subir archivos) y `clientes.json` se actualizó correctamente. Segunda corrida con los mismos datos activó el `catch` de "ya existe", sin duplicar ni tumbar la app.
- Decisión: quién puede crear/actualizar clientes — tanto el admin (app de escritorio) como, a futuro, el cliente (formulario web) pueden **crear**; la validación de duplicados vive en `crearCliente()` mismo, sin importar quién la invoque. **Actualizar** un cliente existente será exclusivo del admin (función `actualizarCliente()`, todavía no construida). La pestaña "datos añadidos" es de acceso exclusivo del administrador (nota de diseño para cuando exista control de acceso multiusuario — todavía no aplica, la app sigue siendo de un solo administrador).

### Completado (continuación, sesión de modularización)
- `main.js` dividido en 3 archivos: `auth.js` (autenticación completa: `oAuth2Client`, `autenticar()`, `obtenerToken()`), `drive.js` (las 5 funciones de Drive), `main.js` (reducido a Electron puro: `createWindow()`, `app.whenReady()`, `ipcMain.handle(...)`)
- Estructura de carpetas reorganizada: `app/` (proceso main — `main.js`, `auth.js`, `drive.js`, `preload.js`, `credenciales.json`), `renderer/` (proceso renderer — `index.html`, `render.js`), `token-google.json` fuera de `app/` (se regenera solo, no importa su ubicación exacta)
- Rutas ajustadas: `RUTA_TOKEN` con `path.join(__dirname, "..", "token-google.json")`, `win.loadFile(path.join(__dirname, "..", "renderer", "index.html"))`, campo `"main"` de `package.json` apuntando a `app/main.js`
- Función `progreso()` (logging de conveniencia) eliminada por completo — no aportaba lógica real y complicaba la modularización al ser llamada desde dos archivos distintos
- App probada corriendo desde la nueva estructura: token cargado, carpeta raíz encontrada, ventana abierta — todo funcionando igual que antes de dividir

### Completado (continuación, sesión de UUID + papelera)
- **Migración de llave de búsqueda**: todos los clientes ahora tienen `UUID` (generado con `crypto.randomUUID()`), usado como identificador interno único. `identificacion`/`tipoIdentificacion` pasaron a ser campos editables (ya no la llave de búsqueda), con su propia validación de duplicados en `actualizarCliente()` (excluyendo al propio cliente).
- **Campo `idCarpeta`** agregado al objeto cliente en `crearCliente()` — captura el `id` que ya devolvía `crearCarpetaCliente()` (antes se descartaba), evitando tener que rebuscar la carpeta por nombre en funciones futuras.
- **Campo `estado`** agregado (`"activo" | "papelera" | "en espera"`, string — se descartó booleano por preferir escalabilidad a más estados a futuro).
- **Trío CRUD de papelera completo**: `moverAPapelera(UUID, idCarpetaRaiz)`, `restaurarCliente(UUID, idCarpetaRaiz)`, `borrarClientePermanente(UUID, idCarpetaRaiz)` (esta última sí borra la carpeta real en Drive con `drive.files.delete()`, además de sacar al cliente del arreglo con `.filter()`).
- `actualizarCliente()` migrado completo a buscar por `UUID` (antes buscaba por `identificacion + tipoIdentificacion`), ahora permite actualizar `nombre`, `descripcionCaso`, `tipoIdentificacion`, `identificacion` (los 4 con el patrón `||` para actualizaciones parciales).

### Estructura actual del objeto cliente (post-migración a UUID)
```js
{
  UUID: "...",              // crypto.randomUUID() — identificador interno, nunca cambia
  nombre: "...",
  tipoIdentificacion: "...", // editable
  identificacion: "...",     // editable
  descripcionCaso: "...",
  archivosInfo: [],
  archivosDatos: [],
  misiones: [],
  estado: "activo",          // "activo" | "papelera" | "en espera"
  idCarpeta: "...",          // id de la carpeta del cliente en Drive
}
```

### Completado (continuación, sesión de conexión UI ↔ backend)
- **CRUD completo de clientes conectado a la UI real**, de punta a punta, probado y funcionando:
  - Crear cliente: vista `vista-nuevo-cliente` con formulario (nombre, tipo de identificación con opciones CC/CE/RE, identificación, descripción del caso) → `crearCliente()`.
  - Listar clientes: `vista-lista` ahora muestra datos reales de Drive (ya no hardcoded), filtrados por `estado === "activo"`.
  - Ver detalle: sin cambios de lógica, ahora alimentado con datos reales.
  - Mover a papelera: botón dentro de `vista-detalle` → `moverAPapelera()`.
  - Vista de papelera (`vista-papelera`): lista aparte con botones "Restaurar" y "Borrar permanente" por cliente.
  - Restaurar: → `restaurarCliente()`, refresca ambas listas (activos y papelera).
  - Borrar permanente: con modal de confirmación propio (`modal-confirmar-borrado`, CSS con `position: fixed` + `display: flex` centrado) antes de ejecutar `borrarClientePermanente()` — irreversible, incluye borrado real de la carpeta en Drive.
- **Bug de race condition corregido**: `createWindow()` reordenado para ejecutarse después de `idCarpetaRaiz = await obtenerCarpetaRaiz()`, evitando que `render.js` pida datos antes de que la carpeta raíz esté lista.
- **`data-id` en el DOM migrado a `UUID`** (antes usaba `identificacion`, que dejó de ser una llave confiable tras la migración a UUID).
- **CSS movido a archivo separado** (`renderer/style.css`), enlazado con `<link>` en vez de bloque `<style>` inline.

### Completado (continuación, sesión de módulos ES + editar cliente)
- **`actualizarCliente()` conectado a la UI completa** (las 4 capas: HTML con `titulo-form-cliente`/`btn-submit-form-cliente` dinámicos, `preload.js`, `main.js`, y la lógica de `UUIDenEdicion` en `render.js`/`formulario.js`) — reutilizando el mismo formulario de "Nuevo cliente" para editar, con pre-rellenado de campos.
- **`render.js` migrado completo a módulos ES** (`render/ui/init.js`, `lista.js`, `detalle.js`, `papelera.js`, `formulario.js`), reemplazando el archivo único. Probado de punta a punta: listar, buscar, detalle, misiones, crear, editar, mover a papelera, restaurar, borrar permanente — todo funcionando igual que antes de la migración.
- `index.html` actualizado: `<script type="module" src="ui/init.js">` en vez de `<script src="render.js">`.

### Completado (continuación, sesión de misiones persistentes + subida de archivos)
- **Misiones ahora persisten en Drive**: `agregarMision()`, `eliminarMision()` conectadas de punta a punta (backend + 4 capas de IPC + UI reescrita para reemplazar `clienteActivo` con el resultado del backend, en vez de mutar en memoria).
- **`drive.js` dividido**: `app/drive/clientes.js` (todo lo de antes) + `app/drive/archivos-local.js` (nuevo).
- **Subida de archivos locales completa**: botón "Subir archivo" en `vista-detalle`, usa `dialog.showOpenDialog` de Electron (múltiples archivos soportados), sube a la carpeta del cliente, guarda `{ nombre, idArchivo }` en `archivosInfo`/`archivosDatos` según la pestaña activa (`pestanaActiva`, variable rastreada en `detalle.js`).
- **Borrado de archivos completo**: botón "✕" por archivo en la lista de cada pestaña, con `boton.disabled` + bandera `operacionEnCurso` para prevenir condiciones de carrera. `eliminarArchivo()` busca en ambos arreglos (no depende de `tipoPestana`), y tolera 404 de Drive (archivo ya borrado) sin bloquear la limpieza de la referencia en `clientes.json`.
- Depurado un bug largo con varias causas simultáneas: condición de carrera entre subir/borrar concurrentes, desajuste de firma de función entre las 4 capas tras un refactor, y un proceso de Electron fantasma ejecutando código viejo — todo documentado arriba en detalle para referencia futura.

### Pendiente / próximos pasos
1. Selector de Google Drive (Google Picker API) — el otro flujo de subida, para elegir archivos que ya existen en el Drive del admin (pendiente desde el diseño original, no iniciado)
2. Aplicar el mismo patrón de `operacionEnCurso` + `disabled` a otros botones async que podrían sufrir el mismo problema de doble-click (ej. "Borrar permanente" en la papelera, "Confirmar borrado" del modal) — no es urgente, pero es la misma clase de bug
3. Descarga de archivos (mostrar → botón de descargar), mencionado como mejora futura al decidir el flujo de "mostrar primero, descargar después"
4. `archivos-picker.js` — reservado para cuando se construya el Picker
5. `archivos-formulario` (nombre pendiente de definir) — lógica para cuando el futuro formulario web permita subir archivos del cliente directo a Drive; depende de que el formulario web exista primero
6. CSS: estilizar toda la UI (sigue con estilos mínimos)
7. Notario: falta el toggle de colapsar/expandir la ventana flotante al hacer click en el header
8. Notificaciones por correo/calendario (ligadas al sistema de misiones)
9. Formulario web (desde cero) — cuando exista, reutiliza `crearCliente()` tal cual, solo cambia el "Extract" (de dónde vienen los datos)
10. Optimización a futuro (no urgente): cada acción vuelve a pedir la lista completa de clientes a Drive vía `iniciar()`, generando lentitud perceptible
11. Pendiente menor: unificar `resource` → `requestBody` en `obtenerCarpetaRaiz()`
12. (Al final del proyecto) Publicar la app en Google Auth Platform: comprar dominio, alojar página de inicio + política de privacidad, pasar verificación de Google — con `drive.file` ya no requiere auditoría CASA Tier 2, solo verificación de marca/identidad

### Preferencia de aprendizaje del usuario
Mentor, no solución directa: explicar concepto → dar esqueleto con huecos → pistas si se traba → nunca código completo salvo configuración repetitiva sin valor pedagógico.

## 🗂️ Otros pendientes menores
- [ ] `app.on('window-all-closed', ...)`
- [ ] OAuth2 y autenticación con Google
- [ ] Google Drive API — llamadas básicas
- [ ] IPC: `ipcMain` / `ipcRenderer`
