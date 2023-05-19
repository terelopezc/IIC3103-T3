const express = require("express");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3001;

// Agrega el middleware para procesar el cuerpo de la solicitud como JSON
app.use(express.json());

let cantidadOperaciones = 0;
let cantidadOperaciones2200 = 0;
let cantidadOperaciones2400 = 0;
let montoOperaciones2200 = 0;
let montoOperaciones2400 = 0;
const mensajes = [];
const bancos = {};

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

function guardarMensajeEnArchivo(mensaje) {
  const data = `${mensaje.tipoOperacion},${mensaje.idMensaje},${mensaje.bancoOrigen},${mensaje.cuentaOrigen},${mensaje.bancoDestino},${mensaje.cuentaDestino},${mensaje.monto},${mensaje.publish_time}\n`;

  fs.appendFile('app.txt', data, (error) => {
    if (error) {
      console.error('Error al guardar el mensaje en el archivo:', error);
    } else {
      console.log('Mensaje guardado exitosamente');
    }
  });

  if (mensajes.length > 100) {
    mensajes.shift();
  }

  if (mensaje.tipoOperacion === "2200") {
    cantidadOperaciones2200++;
    montoOperaciones2200 += Number(mensaje.monto);
    actualizarCuadraturaBancos(mensaje.bancoOrigen, -Number(mensaje.monto));
    actualizarCuadraturaBancos(mensaje.bancoDestino, Number(mensaje.monto));
  } else if (mensaje.tipoOperacion === "2400") {
    cantidadOperaciones2400++;
    montoOperaciones2400 += Number(mensaje.monto);
    actualizarCuadraturaBancos(mensaje.bancoOrigen, Number(mensaje.monto));
    actualizarCuadraturaBancos(mensaje.bancoDestino, -Number(mensaje.monto));
  }
}

function actualizarCuadraturaBancos(banco, monto) {
  if (bancos[banco]) {
    bancos[banco] += monto;
  } else {
    bancos[banco] = monto;
  }
}

app.post("/", (req, res) => {
  const message = req.body.message;
  console.log("Mensaje recibido:", message);
  cantidadOperaciones++;
  const decodedMessage = decodificarMensaje(message.data);
  decodedMessage.publish_time = message.publish_time;

  fs.readFile('app.txt', 'utf8', (error, data) => {
    if (error) {
      console.error('Error al leer el archivo:', error);
    } else {
      if (!data.includes(decodedMessage.idMensaje)) {
        guardarMensajeEnArchivo(decodedMessage);
      } else {
        console.log('Mensaje duplicado, no se guarda');
      }
    }
  });

  mensajes.push(decodedMessage);
  res.status(200).send("Mensaje recibido");
});

app.get("/", (req, res) => {
  let tableRows = '';
  let publishTimeRows = '';
  let montoOperacionesData = [];

  for (let i = mensajes.length - 1; i >= 0; i--) {
    const mensaje = mensajes[i];
    const fechaTransaccion = mensaje.publish_time.substring(0, 10);
    const horaTransaccion = mensaje.publish_time.substring(11, 19);
    tableRows += `
      <tr>
        <td>${mensaje.tipoOperacion}</td>
        <td>${mensaje.idMensaje}</td>
        <td>${mensaje.bancoOrigen}</td>
        <td>${mensaje.cuentaOrigen}</td>
        <td>${mensaje.bancoDestino}</td>
        <td>${mensaje.cuentaDestino}</td>
        <td>${mensaje.monto}</td>
        <td>${fechaTransaccion}</td>
        <td>${horaTransaccion}</td>
      </tr>
    `;
    publishTimeRows += `
      <tr>
        <td>${mensaje.publish_time}</td>
      </tr>
    `;
    montoOperacionesData.push(Number(mensaje.monto));
  }
  let cuadraturaBancosRows = '';
  for (const banco in bancos) {
    cuadraturaBancosRows += `
      <tr>
        <td>${banco}</td>
        <td>${bancos[banco]}</td>
      </tr>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transacciones TereBank</title>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.5.1/dist/chart.min.js"></script>
 
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
            font-size: 12px;
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
          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 12px;
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
          function actualizarContador() {
            const contadorElemento = document.getElementById("contador");
            contadorElemento.textContent = ${cantidadOperaciones};

            const contador2200Elemento = document.getElementById("contador2200");
            contador2200Elemento.textContent = ${cantidadOperaciones2200};

            const contador2400Elemento = document.getElementById("contador2400");
            contador2400Elemento.textContent = ${cantidadOperaciones2400};

            const montoOperaciones2200Elemento = document.getElementById("montoOperaciones2200");
            montoOperaciones2200Elemento.textContent = ${calcularMontoOperaciones("2200")};

            const montoOperaciones2400Elemento = document.getElementById("montoOperaciones2400");
            montoOperaciones2400Elemento.textContent = ${calcularMontoOperaciones("2400")};
          }
          setInterval(actualizarContador, 1000);
          }

        </script>
      </head>
      <body>
        <section>
          <h1>Transacciones TereBank</h1>
          <section>
            <h2>Contadores</h2>
            <p>Total de operaciones recibidas: <span id="contador">${cantidadOperaciones}</span></p>
            <p>Total de operaciones tipo 2200: <span id="contador2200">${cantidadOperaciones2200}</span></p>
            <p>Total de operaciones tipo 2400: <span id="contador2400">${cantidadOperaciones2400}</span></p>
            <p>Monto operaciones tipo 2200: $<span id="montoOperaciones2200">${calcularMontoOperaciones("2200")}</span></p>
            <p>Monto operaciones tipo 2400: $<span id="montoOperaciones2400">${calcularMontoOperaciones("2400")}</span></p>
          </section>
          <table>
            <tr>
              <th>Tipo Operación</th>
              <th>ID Mensaje</th>
              <th>Banco Origen</th>
              <th>Cuenta Origen</th>
              <th>Banco Destino</th>
              <th>Cuenta Destino</th>
              <th>Monto</th>
              <th>Fecha Transacción</th>
              <th>Hora Transacción</th>
            </tr>
            ${tableRows}
          </table>
        </section>
        <section>
          <h2>Cuadratura Bancos</h2>
          <table>
            <tr>
              <th>Banco</th>
              <th>Monto</th>
            </tr>
            ${cuadraturaBancosRows}
          </table>
          <section>
          <section>
          <h2>Histograma de Montos</h2>
          <canvas id="histograma"></canvas>
        </section>

        </section>
    </html>
  `;

  res.send(html);
});

function calcularMontoOperaciones(tipoOperacion) {
  if (tipoOperacion === "2200") {
    return montoOperaciones2200.toFixed(2);
  } else if (tipoOperacion === "2400") {
    return montoOperaciones2400.toFixed(2);
  } else {
    return 0;
  }
}

app.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
});
