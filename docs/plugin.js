/* Plugin CODAP GoGoBoard – versão final 2025-11-01
   - Sem opção "Todas"
   - Com nomes amigáveis (Protótipo #1–#6)
   - Popup ampliado (1000×720)
*/

document.addEventListener("DOMContentLoaded", () => {
  // --- Configurações iniciais ---
  const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
  const mqttBroker = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";
  const topic = "plog/gogodata/#";

  const options = {
    username: "admin",
    password: "@Gogoboard1",
    clean: true,
    connectTimeout: 2000,
    reconnectPeriod: 700,
    protocolVersion: 4,
    rejectUnauthorized: false,
    keepalive: 60
  };

  // --- Sinônimos das placas ---
  const boardAliases = {
    "GoGo-99A5FCE8": "Protótipo #1",
    "GoGo-0C47ED10": "Protótipo #2",
    "GoGo-99A5FCBB": "Protótipo #3",
    "GoGo-99A5FCCC": "Protótipo #4",
    "GoGo-99A5FCDD": "Protótipo #5",
    "GoGo-99A5FCEE": "Protótipo #6"
  };

  // --- Variáveis de estado ---
  let client;
  let collecting = false;
  let codapConnected = false;
  let dataContextCreated = false;
  let dataBuffer = {};
  let sendTimer = {};

  // --- Elementos DOM ---
  const statusEl = document.getElementById("status-message");
  const boardSelect = document.getElementById("boardSelect");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const logOutputEl = document.getElementById("dadosEnviados");

  // --- Funções auxiliares ---
  function updateStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log("[STATUS]", msg);
  }

  function logData(data) {
    if (!logOutputEl) return;
    const displayName = boardAliases[data.board] || data.board;
    const entry = document.createElement("div");
    entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${displayName} | ${Object.entries(data)
      .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
      .filter(Boolean)
      .join(", ")}`;

    if (logOutputEl.children.length > 0 && logOutputEl.children[0].tagName === "B") {
      logOutputEl.insertBefore(entry, logOutputEl.children[1]);
    } else {
      logOutputEl.prepend(entry);
    }

    while (logOutputEl.children.length > 20) {
      logOutputEl.removeChild(logOutputEl.lastChild);
    }
  }

  // --- Comunicação CODAP ---
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
          name: "GoGoData Plugin",
          title: "GoGoData Plugin",
          dimensions: { width: 1000, height: 720 },
          version: "2.0"
        });
        codapConnected = true;
      }

      if (codapConnected && !dataContextCreated) {
        const attributeNames = Object.keys(data).filter(key => key !== "timestamp" && key !== "board");

        const attributes = [
          { name: "timestamp", title: "Carimbo de Tempo", type: "date" },
          { name: "board", title: "Protótipo", type: "categorical" },
          ...attributeNames.map(name => ({
            name: name,
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
      } else if (dataContextCreated) {
        sendCaseToCODAP(data);
      }
    } catch (e) {
      console.warn("⚠️ Erro ao interagir com o CODAP.", e);
    }
  }

  // --- Comunicação MQTT ---
  function connectMQTT() {
    client = mqtt.connect(mqttBroker, options);
    updateStatus("Conectando ao broker...");

    client.on("connect", () => {
      console.log("✅ Conectado ao HiveMQ Cloud");
      updateStatus("Conectado. Aguardando dados...");
      client.subscribe(topic);
    });

    client.on("message", (topic, message) => {
      const payload = message.toString().trim();
      const parts = topic.split("/");
      const boardName = parts[2];
      const sensorName = parts[3];

      if (!boardName || !sensorName || !boardName.startsWith("GoGo-")) return;

      const valueMatch = payload.match(/=([\d.]+)/);
      const value = valueMatch ? parseFloat(valueMatch[1]) : null;
      if (value === null || !collecting) return;

      const selectedBoard = boardSelect.value;
      if (!selectedBoard || boardName !== selectedBoard) return;

      if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
      dataBuffer[boardName][sensorName] = value;

      if (sendTimer[boardName]) clearTimeout(sendTimer[boardName]);

      sendTimer[boardName] = setTimeout(() => {
        const caseObj = {
          timestamp: new Date().toISOString(),
          board: boardAliases[boardName] || boardName,
          ...dataBuffer[boardName]
        };

        sendToCODAP(caseObj);
        logData(caseObj);
        updateStatus("Coleta ativa...");

        delete dataBuffer[boardName];
        delete sendTimer[boardName];
      }, 50);
    });

    client.on("error", err => {
      console.error("❌ Erro MQTT:", err);
      updateStatus("Erro na conexão MQTT");
    });

    client.on("close", () => {
      updateStatus("Desconectado do broker");
    });
  }

  // --- Controles ---
  startBtn.addEventListener("click", () => {
    const selectedBoard = boardSelect.value;
    if (!selectedBoard) {
      updateStatus("Selecione uma placa antes de iniciar a coleta.");
      return;
    }
    collecting = true;
    updateStatus("Coleta iniciada...");
  });

  stopBtn.addEventListener("click", () => {
    collecting = false;
    updateStatus("Coleta pausada.");
  });

  // --- Inicialização ---
  connectMQTT();
  updateStatus("Aguardando conexão...");
});





