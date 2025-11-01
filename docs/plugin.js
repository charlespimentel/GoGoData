// plugin.js — versão ajustada para múltiplas placas e log filtrado

const statusText = document.getElementById("statusText");
const indicator = document.getElementById("statusIndicator");
const boardSelect = document.getElementById("boardSelect");

let codapReady = false;
let collecting = false;
const codapSendQueue = [];

// Map para armazenar as placas detectadas
const boardsDetected = new Set();

// --- Configuração do broker MQTT ---
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

// --- Conexão MQTT ---
const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("✅ Conectado ao HiveMQ Cloud!");
  client.subscribe("plog/#", (err) => {
    if (!err) {
      setStatusIndicator("green");
      console.log("📡 Inscrito em plog/#");
    } else {
      console.error("Erro ao se inscrever:", err);
    }
  });
  if (codapReady) flushCodapQueue();
});

client.on("error", (err) => {
  setStatusIndicator("red");
  console.error("Erro na conexão MQTT:", err);
});

// --- Recepção de mensagens MQTT ---
client.on("message", (topic, message) => {
  const payload = message.toString().trim();
  console.log(`📩 ${topic}: ${payload}`);

  if (!collecting) return;

  const parts = topic.split("/");
  let boardName = parts[2] || "unknown";
  let sensorName = parts[3] || "unknown";

  // adiciona a placa detectada
  if (boardName && !boardsDetected.has(boardName)) {
    boardsDetected.add(boardName);
    updateBoardSelect();
  }

  let valueMatch = payload.match(/=([\d.]+)/);
  let value = valueMatch ? parseFloat(valueMatch[1]) : null;

  if (value !== null) {
    const caseObj = {
      timestamp: new Date().toISOString(),
      board: boardName,
      sensor: sensorName,
      value: value
    };

    // Filtrar pelo menu de seleção
    const selectedBoard = boardSelect ? boardSelect.value : "";
    if (!selectedBoard || selectedBoard === boardName) {
      sendToCODAP(caseObj);
      updateStatus(`Processado: ${sensorName} (${value})`);
      logData(caseObj);
    }
  }
});

// --- Atualiza lista de placas no menu ---
function updateBoardSelect() {
  const select = boardSelect;
  if (!select) return;

  // limpa e recria
  select.innerHTML = '<option value="">Todas</option>';
  [...boardsDetected].forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    select.appendChild(opt);
  });
}

// --- Atualização de status ---
function updateStatus(msg) {
  if (statusText) statusText.textContent = msg;
  console.log("[GoGoData]", msg);
}

function setStatusIndicator(color) {
  if (!indicator) return;
  indicator.classList.remove("bg-gray-400", "bg-green-500", "bg-red-500");
  indicator.classList.add(
    color === "green" ? "bg-green-500" :
    color === "red" ? "bg-red-500" :
    "bg-gray-400"
  );
}

// --- Log visual dos dados (sem nome da placa) ---
function logData(caseObj) {
  const logContainer = document.getElementById("dadosEnviados");
  if (!logContainer) return;

  const hora = new Date(caseObj.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const entry = document.createElement("div");
  entry.textContent = `${hora} | ${caseObj.sensor}: ${caseObj.value}`;
  logContainer.prepend(entry);

  if (logContainer.childNodes.length > 25) {
    logContainer.removeChild(logContainer.lastChild);
  }
}

// --- CODAP Integration ---
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
    updateStatus("CODAP não detectado — modo standalone.");
    codapReady = false;
    return;
  }

  try {
    await codapInterface.init({
      name: "GoGoData",
      title: "Dados GoGoBoard",
      version: "2.0",
      dimensions: { width: 600, height: 400 }
    });

    await codapInterface.sendRequest({
      action: "create",
      resource: "dataContext",
      values: {
        name: "GoGoBoardData",
        title: "Leituras GoGoBoard",
        collections: [
          {
            name: "leituras",
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
    updateStatus("GoGoBoard conectada ao CODAP");
    flushCodapQueue();
  } catch (e) {
    console.error("Erro ao inicializar CODAP:", e);
    updateStatus("Erro ao conectar CODAP");
  }
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

function flushCodapQueue() {
  if (!codapReady || typeof codapInterface === "undefined") return;
  while (codapSendQueue.length > 0) {
    const c = codapSendQueue.shift();
    codapInterface.sendRequest({
      action: "create",
      resource: "dataContext[GoGoBoardData].item",
      values: [c]
    });
  }
  updateStatus("Fila enviada ao CODAP");
}

// --- Botões ---
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

if (startBtn && stopBtn) {
  startBtn.addEventListener("click", () => {
    collecting = true;
    updateStatus("Coleta iniciada...");
    setStatusIndicator("green");
  });

  stopBtn.addEventListener("click", () => {
    collecting = false;
    updateStatus("Coleta interrompida.");
    setStatusIndicator("red");
  });
}

// --- Inicialização ---
(async function boot() {
  updateStatus("Inicializando plugin...");
  await initCodapIfAvailable();
  setStatusIndicator("gray");
})();
