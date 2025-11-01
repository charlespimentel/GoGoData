/* Plugin CODAP GoGoBoard - Revisado por Charles e GPT-5 */

const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
const mqttBroker = "wss://broker.hivemq.com:8884/mqtt";
const topic = "plog/gogodata/#";

let client;
let collecting = false;
let codapConnected = false;
let boards = new Set();

const statusEl = document.getElementById("status");
const boardSelect = document.getElementById("boardSelect");

function updateStatus(msg) {
  statusEl.textContent = "Status: " + msg;
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

// Conexão MQTT
function connectMQTT() {
  client = mqtt.connect(mqttBroker, { clientId });
  updateStatus("Conectando ao broker...");

  client.on("connect", () => {
    console.log("✅ Conectado ao broker HiveMQ");
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log("📡 Inscrito no tópico:", topic);
        updateStatus("Conectado. Aguardando dados...");
      } else {
        console.error("Erro ao se inscrever no tópico:", err);
      }
    });
  });

  // Recebimento de mensagens MQTT
  client.on("message", (topic, message) => {
    const payload = message.toString().trim();
    console.log("📡 Recebido bruto:", topic, payload);

    if (!collecting) {
      console.log("⏸️ Coleta pausada — mensagem ignorada");
      return;
    }

    const parts = topic.split("/");
    const boardName = parts[2] || "unknown";
    const sensorName = parts[3] || "unknown";

    console.log("📍 Identificado board:", boardName, "| sensor:", sensorName);

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

    sendToCODAP(caseObj);
    updateStatus("Processado: " + caseObj.timestamp);
    logData(caseObj);
  });

  client.on("error", (err) => {
    console.error("Erro MQTT:", err);
    updateStatus("Erro na conexão MQTT");
  });

  client.on("close", () => {
    updateStatus("Desconectado do broker");
  });
}

// Envia dados para CODAP
function sendToCODAP(data) {
  if (!codapConnected) {
    codapInterface.init({
      name: "Dados GoGoBoard",
      title: "GoGoBoard Data",
      dimensions: { width: 400, height: 300 },
      version: "1.0"
    });
    codapConnected = true;
  }

  codapInterface.sendRequest({
    action: "create",
    resource: "dataContext[GoGoBoard].item",
    values: [data]
  });
}

// Exibe logs simples no painel
function logData(data) {
  const output = document.getElementById("sentData");
  const entry = document.createElement("div");
  entry.textContent = `[${data.timestamp}] ${data.board} - ${data.sensor}: ${data.value}`;
  output.prepend(entry);
}

// Botões de controle
document.getElementById("startButton").addEventListener("click", () => {
  collecting = true;
  updateStatus("Coleta iniciada...");
});

document.getElementById("stopButton").addEventListener("click", () => {
  collecting = false;
  updateStatus("Coleta pausada.");
});

// Inicialização
connectMQTT();
updateStatus("Aguardando conexão...");



