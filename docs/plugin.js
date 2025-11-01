// plugin.js — versão 1.3 ajustada para o formato plog/gogodata/GoGo-XXXX/Sensor

const statusText = document.getElementById("statusText");
const indicator = document.getElementById("statusIndicator");
const boardSelect = document.getElementById("boardSelect");

let codapReady = false;
let collecting = false;
const codapSendQueue = [];
const knownBoards = new Set();

const brokerUrl = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";

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

// --- Funções de UI ---
function setStatusIndicator(color) {
  indicator.classList.remove("bg-gray-400", "bg-green-500", "bg-red-500");
  if (color === "green") indicator.classList.add("bg-green-500");
  else if (color === "red") indicator.classList.add("bg-red-500");
  else indicator.classList.add("bg-gray-400");
}

function updateStatus(msg) {
  if (statusText) statusText.textContent = msg;
  console.log("[GoGoData] " + msg);
}

function updateBoardList(boardName) {
  if (!boardSelect || knownBoards.has(boardName)) return;
  knownBoards.add(boardName);
  const option = document.createElement("option");
  option.value = boardName;
  option.textContent = boardName;
  boardSelect.appendChild(option);
  console.log("🧩 Nova GoGoBoard detectada:", boardName);
}

function logData(caseObj) {
  const logContainer = document.getElementById("dataLog");
  if (!logContainer) return;
  const entry = document.createElement("div");
  const hora = new Date(caseObj.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  entry.textContent = `${hora} | ${caseObj.sensor}: ${caseObj.value}`;
  logContainer.prepend(entry);
  if (logContainer.childNodes.length > 20) logContainer.removeChild(logContainer.lastChild);
}

// --- Conexão MQTT ---
const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("✅ Conectado ao HiveMQ Cloud");
  client.subscribe("plog/#", (err) => {
    if (!err) {
      setStatusIndicator("green");
      updateStatus("Conectado ao broker MQTT");
    } else console.error("Erro ao se inscrever:", err);
  });
});

client.on("error", (err) => {
  setStatusIndicator("red");
  console.error("Erro MQTT:", err);
});

client.on("message", (topic, message) => {
  const payload = message.toString().trim();
  console.log("📡 Recebido bruto:", topic, payload);

  if (!collecting) {
    console.log("⏸️ Coleta pausada — mensagem ignorada");
    return;
  }

  // --- Extrai dados do tópico ---
  const parts = topic.split("/");
  const boardName = parts[2] || "unknown"; // plog/gogodata/GoGo-XXXX/Sensor
  const sensorName = parts[3] || "unknown";
  updateBoardList(boardName);

  const valueMatch = payload.match(/=([\d.]+)/);
  const value = valueMatch ? parseFloat(valueMatch[1]) : null;
  if (value === null) return;

  const selectedBoard = boardSelect.value;
  if (selectedBoard !== "Todas" && boardName !== selectedBoard) return;

  const caseObj = {
    timestamp: new Date().toISOString(),
    board: boardName,
    sensor: sensorName,
    value: value
  };

  console.log("Enviando ao CODAP:", caseObj);
  sendToCODAP(caseObj);
  updateStatus("Processado: " + caseObj.timestamp);
  logData(caseObj);
});

// --- CODAP ---
async function waitForCodap(timeout = 10000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (typeof codapInterface !== "undefined") return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

async function initCodapIfAvailable() {
  const ok = await waitForCodap();
  if (!ok) {
    updateStatus("CODAP não detectado — modo standalone");
    codapReady = false;
    return;
  }

  await codapInterface.init({
    name: "GoGoData",
    title: "Dados GoGoBoard",
    version: "1.3",
    dimensions: { width: 600, height: 400 }
  });

  await codapInterface.sendRequest({
    action: "create",
    resource: "dataContext",
    values: {
      name: "GoGoBoardData",
      title: "Leituras da GoGoBoard",
      collections: [
        {
          name: "leituras",
          labels: { singleCase: "leitura", pluralCase: "leituras" },
          attrs: [
            { name: "timestamp", type: "date" },
            { name: "board", type: "categorical" },
            { name: "sensor", type: "categorical" },
            { name: "value", type: "numeric" }
          ]
        }
      ]
    }
  });

  codapReady = true;
  updateStatus("GoGoBoard pronta para coleta");
}

function sendToCODAP(caseObj) {
  if (codapReady && typeof codapInterface !== "undefined") {
    codapInterface.sendRequest({
      action: "create",
      resource: "dataContext[GoGoBoardData].item",
      values: [caseObj]
    });
  } else {
    codapSendQueue.push(caseObj);
  }
}

// --- Botões ---
const startBtn = document.getElementById("startButton");
const stopBtn = document.getElementById("stopButton");

if (startBtn && stopBtn) {
  startBtn.addEventListener("click", () => {
    collecting = true;
    updateStatus("Coleta iniciada — aguardando dados...");
    setStatusIndicator("green");
    console.log("▶️ Coleta iniciada");
  });

  stopBtn.addEventListener("click", () => {
    collecting = false;
    updateStatus("Coleta interrompida");
    setStatusIndicator("red");
    console.log("⏹️ Coleta interrompida");
  });
}

// --- Inicialização ---
(async function boot() {
  updateStatus("Inicializando plugin...");
  await initCodapIfAvailable();
  console.log("Boot completo. codapReady =", codapReady);
  setStatusIndicator("gray");
})();


