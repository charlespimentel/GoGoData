/* Plugin CODAP GoGoBoard – Versão Definitiva (HiveMQ Cloud + Trigger de Seleção) */

document.addEventListener("DOMContentLoaded", () => {

  // --- Configurações Iniciais ---
  const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
  const mqttBroker = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";
  const topic = "plog/gogodata/#";

  // --- Opções de autenticação (HiveMQ Cloud) ---
  const mqttOptions = {
    clientId: clientId,
    username: "admin",
    password: "@Gogoboard1",
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 4000
  };

  // --- Variáveis de Estado ---
  let client;
  let collecting = false;
  let codapConnected = false;
  let dataContextCreated = false;
  let boards = new Set();
  let dataBuffer = {};
  let sendTimer = {};

  // --- Elementos DOM ---
  const statusEl = document.getElementById("status-message");
  const boardSelect = document.getElementById("boardSelect");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const logOutputEl = document.getElementById("dadosEnviados");

  // --- Funções Auxiliares ---

  function updateStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log("[STATUS]", msg);
  }

  function updateBoardList(boardName) {
    if (boardName && boardName.startsWith("GoGo-") && !boards.has(boardName)) {
      boards.add(boardName);
      const option = document.createElement("option");
      option.value = boardName;
      option.textContent = boardName;
      boardSelect.appendChild(option);
      console.log("🧩 Nova GoGoBoard detectada e adicionada:", boardName);
    }
  }

  function logData(data) {
    if (!logOutputEl) return;

    const entry = document.createElement("div");
    entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ${Object.entries(data)
      .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
      .filter(Boolean)
      .join(", ")}`;

    if (logOutputEl.children.length > 0 && logOutputEl.children[0].tagName === "B") {
      logOutputEl.insertBefore(entry, logOutputEl.children[1]);
    } else {
      logOutputEl.prepend(entry);
    }

    let childCount = logOutputEl.children.length;
    if (logOutputEl.querySelector("b")) childCount--;

    while (childCount > 20) {
      logOutputEl.removeChild(logOutputEl.lastChild);
      childCount--;
    }
  }

  // --- Comunicação com CODAP ---

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
        console.log("✨ Tentando conectar ao CODAP.");
      }

      if (codapConnected && !dataContextCreated) {
        const attributeNames = Object.keys(data).filter(
          key => key !== "timestamp" && key !== "board"
        );

        const attributes = [
          { name: "timestamp", title: "Carimbo de Tempo", type: "date" },
          { name: "board", title: "Placa", type: "categorical" },
          ...attributeNames.map(name => ({
            name: name,
            title: name.charAt(0).toUpperCase() + name.slice(1),
            type: "numeric"
          }))
        ];

        codapInterface
          .sendRequest({
            action: "create",
            resource: "dataContext",
            values: {
              name: "GoGoBoard",
              collections: [
                {
                  name: "Dados Sensores",
                  attrs: attributes
                }
              ]
            }
          })
          .then(result => {
            if (result.success) {
              dataContextCreated = true;
              console.log("✔️ Data Context 'GoGoBoard' criado no CODAP.");
              sendCaseToCODAP(data);
            } else {
              console.warn("⚠️ Data Context não criado (possivelmente já existe). Tentando enviar o caso.");
              dataContextCreated = true;
              sendCaseToCODAP(data);
            }
          });
      } else if (dataContextCreated) {
        sendCaseToCODAP(data);
      }

    } catch (e) {
      console.warn("⚠️ Erro ao interagir com o CODAP (verifique se o plugin está embutido).", e);
    }
  }

  // --- Comunicação MQTT ---

  function connectMQTT() {
    client = mqtt.connect(mqttBroker, mqttOptions);
    updateStatus("Conectando ao broker...");

    client.on("connect", () => {
      console.log("✅ Conectado ao HiveMQ Cloud");
      updateStatus("Conectado. Aguardando detecção de placas...");
      client.subscribe(topic); // Primeiro só detecta as placas
    });

    client.on("message", (topic, message) => {
      const payload = message.toString().trim();
      const parts = topic.split("/");

      const boardName = parts[2];
      const sensorName = parts[3];

      if (!boardName || !sensorName || !boardName.startsWith("GoGo-")) return;
      updateBoardList(boardName); // detecta placas

      const selectedBoard = boardSelect.value;
      if (!collecting || selectedBoard === "" || selectedBoard === "Todas" || boardName !== selectedBoard) return;

      const valueMatch = payload.match(/=([\d.]+)/);
      const value = valueMatch ? parseFloat(valueMatch[1]) : null;
      if (value === null) return;

      if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
      dataBuffer[boardName][sensorName] = value;

      if (sendTimer[boardName]) clearTimeout(sendTimer[boardName]);

      sendTimer[boardName] = setTimeout(() => {
        const caseObj = {
          timestamp: new Date().toISOString(),
          board: boardName,
          ...dataBuffer[boardName]
        };

        sendToCODAP(caseObj);
        logData(caseObj);
        updateStatus(`Coletando dados da ${boardName}...`);

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

  // --- Event Listeners e Inicialização ---

  startBtn.addEventListener("click", () => {
    const selectedBoard = boardSelect.value;
    if (!selectedBoard || selectedBoard === "Todas") {
      updateStatus("Selecione uma GoGoBoard antes de iniciar a coleta.");
      alert("Por favor, selecione uma GoGoBoard antes de iniciar a coleta.");
      return;
    }
    collecting = true;
    updateStatus(`Coleta iniciada para ${selectedBoard}...`);
    console.log(`▶️ Coleta iniciada para ${selectedBoard}`);
  });

  stopBtn.addEventListener("click", () => {
    collecting = false;
    updateStatus("Coleta pausada.");
    console.log("⏹️ Coleta pausada");
  });

  connectMQTT();
  updateStatus("Aguardando conexão...");
});

