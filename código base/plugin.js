/* Plugin CODAP GoGoBoard – versão estável 2025-11-01
   - Corrige “Unknown Game”
   - Mantém compatibilidade completa com CODAP e MQTT
   - Nomes amigáveis (Microcontrolador #1–#6)
   - Tamanho fixo no CODAP (720×520)
*/

document.addEventListener("DOMContentLoaded", async () => {

  // --- Registro no CODAP ---
  try {
    await codapInterface.init({
      name: "GoGoData",
      title: "GoGoData - GRECO/TLTL/TLIC",
      version: "2.0",
      dimensions: { width: 720, height: 520 },
      preventDataContextReorg: true
    });

    console.log("Plugin GoGoData registrado corretamente no CODAP.");
  } catch (err) {
    console.warn("Erro ao registrar no CODAP:", err);
  }

  // --- Configurações MQTT ---
  const mqttBroker = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";
  const topic = "plog/gogodata/#";

  const options = {
    username: "admin",
    password: "@Gogoboard1",
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    protocolVersion: 4,
    rejectUnauthorized: false,
    keepalive: 60
  };

  // --- Sinônimos das placas ---
  const boardAliases = {
    "GoGo-99A5FCE8": "Microcontrolador #1",
    "GoGo-0C47ED10": "Microcontrolador #2",
    "GoGo-99A5FCBB": "Microcontrolador #3",
    "GoGo-99A5FCCC": "Microcontrolador #4",
    "GoGo-99A5FCDD": "Microcontrolador #5",
    "GoGo-99A5FCEE": "Microcontrolador #6"
  };

  // --- Estado interno ---
  let client;
  let collecting = false;
  let dataContextCreated = false;
  let dataBuffer = {};
  let sendTimer = {};

  // --- Elementos DOM ---
  const statusEl = document.getElementById("status-message");
  const boardSelect = document.getElementById("boardSelect");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const logOutputEl = document.getElementById("dadosEnviados");

  // --- Atualiza status ---
  function updateStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log("[STATUS]", msg);
  }

  // --- Log visual ---
  function logData(data) {
    if (!logOutputEl) return;

    const displayName = boardAliases[data.board] || data.board;
    const entry = document.createElement("div");

    entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${displayName} | ${Object.entries(data)
      .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
      .filter(Boolean)
      .join(", ")}`;

    logOutputEl.prepend(entry);

    while (logOutputEl.children.length > 25) {
      logOutputEl.removeChild(logOutputEl.lastChild);
    }
  }

  // --- Envio ao CODAP ---
  function sendCaseToCODAP(data) {
    if (dataContextCreated) {
      codapInterface.sendRequest({
        action: "create",
        resource: "dataContext[GoGoBoard].item",
        values: [data]
      });
    }
  }

  function sendToCODAP(data) {
    if (!dataContextCreated) {
      const attributeNames = Object.keys(data).filter(
        key => key !== "timestamp" && key !== "board"
      );

      const attributes = [
        { name: "timestamp", title: "Carimbo de Tempo", type: "date" },
        { name: "board", title: "Protótipo", type: "categorical" },
        ...attributeNames.map(name => ({
          name,
          title: name.charAt(0).toUpperCase() + name.slice(1),
          type: "numeric"
        }))
      ];

      codapInterface.sendRequest({
        action: "create",
        resource: "dataContext",
        values: {
          name: "GoGoBoard",
          collections: [{ name: "Dados Sensores", attrs: attributes }]
        }
      }).then(() => {
        dataContextCreated = true;
        sendCaseToCODAP(data);
      });
    } else {
      sendCaseToCODAP(data);
    }
  }

  // --- MQTT ---
  function connectMQTT() {
    client = mqtt.connect(mqttBroker, options);

    updateStatus("Conectando ao broker...");

    client.on("connect", () => {
      updateStatus("Conectado. Aguardando dados...");
      client.subscribe(topic);
    });

    client.on("message", (topic, message) => {
      if (!collecting) return;

      const payload = message.toString().trim();
      const parts = topic.split("/");
      const boardName = parts[2];
      const sensorName = parts[3];

      if (!boardName || !sensorName || !boardName.startsWith("GoGo-")) return;
      if (boardName !== boardSelect.value) return;

      const match = payload.match(/=([\d.]+)/);
      if (!match) return;

      const value = parseFloat(match[1]);

      if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
      dataBuffer[boardName][sensorName] = value;

      clearTimeout(sendTimer[boardName]);

      sendTimer[boardName] = setTimeout(() => {
        const caseObj = {
          timestamp: new Date().toISOString(),
          board: boardName,
          ...dataBuffer[boardName]
        };

        sendToCODAP(caseObj);
        logData(caseObj);
        updateStatus("Coleta ativa...");

        delete dataBuffer[boardName];
      }, 60);
    });
  }

  // --- Botões ---
    startBtn.addEventListener("click", () => {
      if (!boardSelect.value) {
        updateStatus("Selecione uma placa antes de iniciar a coleta.");
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
