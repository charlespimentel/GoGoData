/* Plugin CODAP GoGoBoard – versão multi-sensores em colunas (com teste de seletor) */

const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
const mqttBroker = "wss://broker.hivemq.com:8884/mqtt";
const topic = "plog/gogodata/#";

let client;
let collecting = false;
let codapConnected = false;
let boards = new Set();
let dataBuffer = {};

const statusEl = document.getElementById("status");
const boardSelect = document.getElementById("boardSelect");

function updateStatus(msg) {
  if (statusEl) statusEl.textContent = "Status: " + msg;
  console.log("[STATUS]", msg);
}

function updateBoardList(boardName) {
  if (!boards.has(boardName)) {
    boards.add(boardName);
    const option = document.createElement("option");
    option.value = boardName;
    option.textContent = boardName;
    boardSelect.appendChild(option);
    console.log("🧩 Nova GoGoBoard detectada:", boardName);
  }
}

function connectMQTT() {
  client = mqtt.connect(mqttBroker, { clientId });
  updateStatus("Conectando ao broker...");

  client.on("connect", () => {
    console.log("✅ Conectado ao broker HiveMQ");
    updateStatus("Conectado. Aguardando dados...");
    client.subscribe(topic);

    // 👇 INSERE UMA PLACA DE TESTE AUTOMÁTICA
    setTimeout(() => {
      updateBoardList("GoGo-TestBoard");
      console.log("✅ Teste: GoGo-TestBoard adicionada manualmente ao seletor.");
    }, 1500);
  });

  client.on("message", (topic, message) => {
    const payload = message.toString().trim();
    console.log("📡 Recebido bruto:", topic, payload);

    const parts = topic.split("/");
    const boardName = parts[2] || "unknown";
    const sensorName = parts[3] || "unknown";
    updateBoardList(boardName);

    const valueMatch = payload.match(/=([\d.]+)/);
    const value = valueMatch ? parseFloat(valueMatch[1]) : null;
    if (value === null) return;

    if (!collecting) {
      console.log("⏸️ Coleta pausada — mensagem ignorada");
      return;
    }

    const selectedBoard = boardSelect.value;
    if (selectedBoard !== "" && selectedBoard !== "Todas" && boardName !== selectedBoard) return;

    if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
    dataBuffer[boardName][sensorName] = value;

    const caseObj = {
      timestamp: new Date().toISOString(),
      board: boardName,
      ...dataBuffer[boardName]
    };

    sendToCODAP(caseObj);
    logData(caseObj);
    updateStatus("Coleta ativa...");
  });
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

    if (codapConnected) {
      codapInterface.sendRequest({
        action: "create",
        resource: "dataContext[GoGoBoard].item",
        values: [data]
      });
    }
  } catch (e) {
    console.warn("⚠️ CODAP não disponível, exibindo localmente.");
  }
}

function logData(data) {
  const output = document.getElementById("dadosEnviados");
  if (!output) return;

  const entry = document.createElement("div");
  entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ${Object.entries(data)
    .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
    .filter(Boolean)
    .join(", ")}`;
  output.prepend(entry);
}

document.getElementById("startBtn").addEventListener("click", () => {
  collecting = true;
  updateStatus("Coleta iniciada...");
  console.log("▶️ Coleta iniciada");
});

document.getElementById("stopBtn").addEventListener("click", () => {
  collecting = false;
  updateStatus("Coleta pausada.");
  console.log("⏹️ Coleta pausada");
});

connectMQTT();
updateStatus("Aguardando conexão...");







