const express = require("express");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3001;

// Agrega el middleware para procesar el cuerpo de la solicitud como JSON
app.use(express.json());

let cantidadOperaciones = 0;
const mensajes = [];

function decodificarMensaje(base64) {
  const decodedData = Buffer.from(base64, 'base64').toString('utf-8');
  const tipoOperacion = decodedData.substring(0, 4);
  const idMensaje = decodedData.substring(4, 14);
  const bancoOrigen = decodedData.substring(14, 21).padStart(7, '0');
  const cuentaOrigen = decodedData.substring(21, 31).padStart(10, '0');
  const bancoDestino = decodedData.substring(31, 38).padStart(7, '0');
  const cuentaDestino = decodedData.substring(38, 48).padStart(10, '0');
  const monto = decodedData.substring(48).padStart(16, '0');

  return {
    tipoOperacion,
    idMensaje,
    bancoOrigen,
    cuentaOrigen,
    bancoDestino,
    cuentaDestino,
    monto,
  };
}

// Función para guardar un mensaje decodificado en el archivo app.txt
function guardarMensajeEnArchivo(mensaje) {
  const data = `${mensaje.tipoOperacion},${mensaje.idMensaje},${mensaje.bancoOrigen},${mensaje.cuentaOrigen},${mensaje.bancoDestino},${mensaje.cuentaDestino},${mensaje.monto}\n`;

  fs.appendFile('app.txt', data, (error) => {
    if (error) {
      console.error('Error al guardar el mensaje en el archivo:', error);
    } else {
      console.log('Mensaje guardado exitosamente');
    }
  });
}

// Ruta POST para recibir los mensajes de Pub/Sub
app.post("/", (req, res) => {
  const message = req.body.message;
  // Aquí puedes realizar acciones basadas en el mensaje recibido
  console.log("Mensaje recibido:", message);
  cantidadOperaciones++;
  const decodedMessage = decodificarMensaje(message.data);

  // Verificar si el mensaje ya existe en el archivo
  fs.readFile('app.txt', 'utf8', (error, data) => {
    if (error) {
      console.error('Error al leer el archivo:', error);
    } else {
      if (!data.includes(decodedMessage.idMensaje)) {
        // El mensaje no existe en el archivo, guardarlo
        guardarMensajeEnArchivo(decodedMessage);
      } else {
        console.log('Mensaje duplicado, no se guarda');
      }
    }
  });

  mensajes.push(decodedMessage);
  res.status(200).send("Mensaje recibido");
});

// Ruta GET para mostrar la página HTML con la tabla de mensajes
app.get("/", (req, res) => {
  let tableRows = '';
  for (const mensaje of mensajes) {
    tableRows += `
      <tr>
        <td>${mensaje.tipoOperacion}</td>
        <td>${mensaje.idMensaje}</td>
        <td>${mensaje.bancoOrigen}</td>
        <td>${mensaje.cuentaOrigen}</td>
        <td>${mensaje.bancoDestino}</td>
        <td>${mensaje.cuentaDestino}</td>
        <td>${mensaje.monto}</td>
      </tr>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transacciones TereBank</title>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
        <script>
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              disableForReducedMotion: true
            });
          }, 500);
        </script>
        <style>
          @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
          @font-face {
            font-family: "neo-sans";
            src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
            font-style: normal;
            font-weight: 700;
          }
          html {
            font-family: neo-sans;
            font-weight: 700;
            font-size: 12px; /* Tamaño de fuente ajustado */
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          section {
            border-radius: 1em;
            padding: 1em;
            margin: 1em;
          }
          /* Estilos de la tabla */
          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 12px; /* Tamaño de fuente ajustado */
            text-align: left;
          }

          th, td {
            padding: 8px;
            vertical-align: top;
          }

          th {
            background-color: #f2f2f2;
          }
        </style>
        <script>
          // Función para actualizar el contador de transacciones
          function actualizarContador() {
            const contadorElemento = document.getElementById("contador");
            contadorElemento.textContent = ${cantidadOperaciones};
          }

          // Actualizar el contador al cargar la página
          window.addEventListener("DOMContentLoaded", () => {
            actualizarContador();
          });
        </script>
      </head>
      <body>
        <section>
          <h1>Transacciones TereBank</h1>
          <p>Transacciones realizadas: <span id="contador"></span></p>
          <table>
            <tr>
              <th>Tipo de Operación</th>
              <th>ID de Mensaje</th>
              <th>Banco de Origen</th>
              <th>Cuenta de Origen</th>
              <th>Banco de Destino</th>
              <th>Cuenta de Destino</th>
              <th>Monto</th>
            </tr>
            ${tableRows}
          </table>
        </section>
      </body>
    </html>
  `;

  res.type('html').send(html);
});

app.listen(port, () => console.log(`La aplicación está escuchando en el puerto ${port}!`));
