/* GoGoData Plugin – Coleta apenas das placas definidas manualmente */

document.addEventListener("DOMContentLoaded", () => {
  const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
  const mqttBroker = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";
  const topic = "plog/gogodata/#";

  const mqttOptions = {
    clientId,
    username: "admin",
    password: "@Gogoboard1",
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 4000
  };

  const knownBoards = [
    "GoGo-99A5FCE8",
    "GoGo-99A5FCAA",
    "GoGo-99A5FCBB",
    "GoGo-99A5FCCC",
    "GoGo-99A5FCDD",
    "GoGo-99A5FCEE"
  ];

  let client;
  let collecting = false;
  let codapConnected = false;
  let dataContextCreated = false;
  let activeBoards = new Set();
  let dataBuffer = {};
  let sendTimer = {};

  const statusEl = document.getElementById("status-message");
  const logOutputEl = document.getElementById("dadosEnviados");

  function updateStatus(msg) {
    statusEl.textContent = msg;
    console.log("[STATUS]", msg);
  }

  function updateBoardData(boardName, sensorData) {
    const div = document.getElementById(`data-${boardName}`);
    if (!div) return;
    const formatted = Object.entries(sensorData)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    div.textContent = formatted;
  }

  function logData(data) {
    const entry = document.createElement("div");
    entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ${Object.entries(data)
      .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
      .filter(Boolean)
      .join(", ")}`;
    logOutputEl.prepend(entry);
    while (logOutputEl.children.length > 20) {
      logOutputEl.removeChild(logOutputEl.lastChild);
    }
  }

  function sendCaseToCODAP(data) {
    if (codapConnected && dataContextCreated) {
      codapInterface.sendRequest({
        action: "create",
        resource: "dataContext[GoGoBoard].item",
        values: [data]
      });
    }
  }

  function sendToCODAP(data) {
    try {
      if (!codapConnected && typeof codapInterface !== "undefined") {
        codapInterface.init({
          name: "Dados GoGoBoard",
          title: "GoGoBoard Data",
          dimensions: { width: 400, height: 300 },
          version: "2.0"
        });
        codapConnected = true;
      }

      if (codapConnected && !dataContextCreated) {
        const attributes = [
          { name: "timestamp", title: "Carimbo de Tempo", type: "date" },
          { name: "board", title: "Placa", type: "categorical" },
          { name: "Luz", title: "Luz", type: "numeric" },
          { name: "Sensor1", title: "Sensor 1", type: "numeric" },
          { name: "Sensor2", title: "Sensor 2", type: "numeric" },
          { name: "Sensor3", title: "Sensor 3", type: "numeric" },
          { name: "Sensor4", title: "Sensor 4", type: "numeric" }
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
    } catch (e) {
      console.warn("Erro CODAP:", e);
    }
  }

  function connectMQTT() {
    client = mqtt.connect(mqttBroker, mqttOptions);
    updateStatus("Conectando ao broker...");

    client.on("connect", () => {
      updateStatus("✅ Conectado ao HiveMQ Cloud. Aguardando dados...");
      client.subscribe(topic);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString().trim();
      const parts = topic.split("/");
      const boardName = parts[2];
      const sensorName = parts[3];

      if (!knownBoards.includes(boardName)) return;

      if (!collecting || !activeBoards.has(boardName)) return;

      const valueMatch = payload.match(/=([\d.]+)/);
      const value = valueMatch ? parseFloat(valueMatch[1]) : null;
      if (value === null) return;

      if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
      dataBuffer[boardName][sensorName] = value;

      updateBoardData(boardName, dataBuffer[boardName]);

      if (sendTimer[boardName]) clearTimeout(sendTimer[boardName]);

      sendTimer[boardName] = setTimeout(() => {
        const caseObj = {
          timestamp: new Date().toISOString(),
          board: boardName,
          ...dataBuffer[boardName]
        };
        sendToCODAP(caseObj);
        logData(caseObj);
        updateStatus(`📡 Dados recebidos de ${boardName}`);
        delete dataBuffer[boardName];
        delete sendTimer[boardName];
      }, 80);
    });

    client.on("error", (err) => updateStatus("❌ Erro MQTT: " + err.message));
    client.on("close", () => updateStatus("🔌 Desconectado do broker"));
  }

  // --- Ativação manual das placas via checkbox ---
  document.querySelectorAll(".boardCheckbox").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const board = e.target.value;
      if (e.target.checked) {
        activeBoards.add(board);
        updateStatus(`✅ Coleta ativada para ${board}`);
      } else {
        activeBoards.delete(board);
        updateStatus(`⏸️ Coleta pausada para ${board}`);
      }
    });
  });

  // --- Botões ---
  document.getElementById("startBtn").addEventListener("click", () => {
    collecting = true;
    updateStatus("▶️ Coleta iniciada.");
  });

  document.getElementById("stopBtn").addEventListener("click", () => {
    collecting = false;
    updateStatus("⏹️ Coleta pausada.");
  });

  connectMQTT();
});


