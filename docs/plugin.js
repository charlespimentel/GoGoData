/* Plugin CODAP GoGoBoard – versão multi-sensores em colunas */

const clientId = "gogodata-" + Math.random().toString(16).substr(2, 8);
const mqttBroker = "wss://broker.hivemq.com:8884/mqtt";
const topic = "plog/gogodata/#";

let client;
let collecting = false;
let codapConnected = false;
let boards = new Set();
let dataBuffer = {}; // Armazena leituras temporárias por placa

// Referências a elementos do DOM
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

    // Divide o tópico para extrair GoGoBoard e sensor
    const parts = topic.split("/");
    const boardName = parts[2] || "unknown";
    const sensorName = parts[3] || "unknown";

    // Sempre registra a placa (mesmo se coleta estiver pausada)
    updateBoardList(boardName);

    // Extrai o valor numérico do payload
    const valueMatch = payload.match(/=([\d.]+)/);
    const value = valueMatch ? parseFloat(valueMatch[1]) : null;
    if (value === null) return;

    // Se coleta estiver pausada, apenas atualiza lista e ignora valores
    if (!collecting) {
      console.log("⏸️ Coleta pausada — mensagem ignorada");
      return;
    }

    // Filtra se o usuário selecionou uma placa específica
    const selectedBoard = boardSelect.value;
    if (selectedBoard !== "" && selectedBoard !== "Todas" && boardName !== selectedBoard) return;

    // Armazena o valor no buffer da placa
    if (!dataBuffer[boardName]) dataBuffer[boardName] = {};
    dataBuffer[boardName][sensorName] = value;

    // Monta o objeto consolidado
    const caseObj = {
      timestamp: new Date().toISOString(),
      board: boardName,
      ...dataBuffer[boardName]
    };

    sendToCODAP(caseObj);
    logData(caseObj);
    updateStatus("Coleta ativa...");
  });

  client.on("error", (err) => {
    console.error("❌ Erro MQTT:", err);
    updateStatus("Erro na conexão MQTT");
  });

  client.on("close", () => {
    updateStatus("Desconectado do broker");
  });
}

// Envia dados para o CODAP
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
      console.log("🔗 Conectado ao CODAP");
    }

    if (codapConnected) {
      codapInterface.sendRequest({
        action: "create",
        resource: "dataContext[GoGoBoard].item",
        values: [data]
      });
    }
  } catch (e) {
    console.warn("⚠️ CODAP não disponível. Dados apenas exibidos localmente.");
  }
}

// Exibe logs no painel
function logData(data) {
  const output = document.getElementById("dadosEnviados");
  if (!output) return;

  const entry = document.createElement("div");
  entry.textContent = `[${new Date(data.timestamp).toLocaleTimeString("pt-BR")}] ${data.board} | ${Object.entries(data)
    .map(([k, v]) => (k !== "timestamp" && k !== "board" ? `${k}: ${v}` : ""))
    .filter(Boolean)
    .join(", ")}`;
  output.prepend(entry);

  // Mantém o log limpo com até 20 entradas
  while (output.childNodes.length > 22) {
    output.removeChild(output.lastChild);
  }
}

// Botões
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

// Inicializa MQTT
connectMQTT();
updateStatus("Aguardando conexão...");






