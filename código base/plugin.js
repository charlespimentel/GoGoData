/* Plugin CODAP GoGoBoard – versão estável
   - Mapeamento explícito ID → número → nome
   - Coluna board mostra apenas nome amigável
   - Compatível com CODAP + MQTT
*/

document.addEventListener("DOMContentLoaded", async () => {

  // Registro no CODAP
  await codapInterface.init({
    name: "GoGoData",
    title: "GoGoData - GRECO/TLTL/TLIC",
    version: "2.0",
    dimensions: { width: 720, height: 520 },
    preventDataContextReorg: true
  });

  // MQTT
  const mqttBroker = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";
  const topic = "plog/gogodata/#";

  const options = {
    username: "admin",
    password: "@Gogoboard1",
    clean: true,
    reconnectPeriod: 1000,
    keepalive: 60
  };

  // Mapeamento único das placas
  const boards = {
    "GoGo-99A5FCE8": { number: 1, name: "Microcontrolador #1" },
    "GoGo-0C47ED10": { number: 2, name: "Microcontrolador #2" },
    "GoGo-99A5FCBB": { number: 3, name: "Microcontrolador #3" },
    "GoGo-99A5FCCC": { number: 4, name: "Microcontrolador #4" },
    "GoGo-99A5FCDD": { number: 5, name: "Microcontrolador #5" },
    "GoGo-99A5FCEE": { number: 6, name: "Microcontrolador #6" }
  };

  // Estado
  let client;
  let collecting = false;
  let dataContextCreated = false;
  let buffer = {};
  let timers = {};

  // DOM
  const statusEl = document.getElementById("status-message");
  const boardSelect = document.getElementById("boardSelect");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const logEl = document.getElementById("dadosEnviados");

  const updateStatus = msg => statusEl.textContent = msg;

  // Log visual
  function logData(data) {
    const div = document.createElement("div");
    div.textContent =
      `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ` +
      Object.entries(data)
        .filter(([k]) => !["timestamp", "board"].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    logEl.prepend(div);
  }

  // CODAP
  function sendToCODAP(caseObj) {
    if (!dataContextCreated) {
      const attrs = [
        { name: "timestamp", type: "date" },
        { name: "board", type: "categorical" },
        ...Object.keys(caseObj)
          .filter(k => !["timestamp", "board"].includes(k))
          .map(k => ({ name: k, type: "numeric" }))
      ];

      codapInterface.sendRequest({
        action: "create",
        resource: "dataContext",
        values: {
          name: "GoGoBoard",
          collections: [{ name: "Dados Sensores", attrs }]
        }
      }).then(() => {
        dataContextCreated = true;
        sendToCODAP(caseObj);
      });

      return;
    }

    codapInterface.sendRequest({
      action: "create",
      resource: "dataContext[GoGoBoard].item",
      values: [caseObj]
    });
  }

  // MQTT
  function connectMQTT() {
    client = mqtt.connect(mqttBroker, options);

    updateStatus("Conectando ao broker...");

    client.on("connect", () => {
      updateStatus("Conectado. Aguardando dados...");
      client.subscribe(topic);
    });

    client.on("message", (topic, message) => {
      if (!collecting) return;

      const parts = topic.split("/");
      const boardId = parts[2];
      const sensor = parts[3];

      if (boardId !== boardSelect.value) return;

      const match = message.toString().match(/=([\d.]+)/);
      if (!match) return;

      if (!buffer[boardId]) buffer[boardId] = {};
      buffer[boardId][sensor] = Number(match[1]);

      clearTimeout(timers[boardId]);

      timers[boardId] = setTimeout(() => {
        const boardInfo = boards[boardId];

        const caseObj = {
          timestamp: new Date().toISOString(),
          board: boardInfo.name,
          ...buffer[boardId]
        };

        sendToCODAP(caseObj);
        logData(caseObj);
        updateStatus("Coleta ativa...");

        delete buffer[boardId];
      }, 60);
    });
  }

  // Botões
  startBtn.addEventListener("click", () => {
    if (!boardSelect.value) {
      updateStatus("Selecione uma placa antes de iniciar.");
      return;
    }
    collecting = true;
    updateStatus("Coleta iniciada...");
  });

  stopBtn.addEventListener("click", () => {
    collecting = false;
    updateStatus("Coleta parada.");
  });

  connectMQTT();
});
