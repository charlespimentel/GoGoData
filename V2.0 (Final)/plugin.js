// plugin.js (versão adaptada com log visual de dados enviados)

const statusText = document.getElementById("statusText");

// ---Teste Fake Parte 1---
/*
const fakeBtn = document.getElementById("sendFakeButton");
*/

const indicator = document.getElementById("statusIndicator");

let codapReady = false;

// --- Controle de coleta ---
let collecting = false; // 26 de outubro define se os dados serão enviados ao CODAP

// fila para casos que chegam antes do codapInterface estar pronto
const codapSendQueue = [];

// Broker MQTT (HiveMQ Cloud)
const brokerUrl = "wss://97b1be8c4f87478a93468f5795d02a96.s1.eu.hivemq.cloud:8884/mqtt";

const options = {
  username: "admin",
  password: "Gogoboard!1",
  clean: true,
  connectTimeout: 2000,
  reconnectPeriod: 1000 // tenta reconectar a cada 1s
};

// --- Conexão MQTT ---
const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("✅ Conectado ao HiveMQ Cloud!");
  client.subscribe("plog/#", (err) => {
    if (!err) {
      setStatusIndicator("green");
      console.log("Inscrito em plog/#");
    } else {
      console.error("Erro ao se inscrever:", err);
    }
  });
});

client.on("error", (err) => {
  setStatusIndicator("red");
  console.error("Erro na conexão MQTT:", err);
});

// --- Recepção de mensagens MQTT ---
client.on("message", (topic, message) => {
  const payload = message.toString().trim();
  console.log(`Mensagem recebida de ${topic}:`, payload);

  // 26 de outubro Se a coleta estiver desativada, ignora as mensagens
  if (!collecting) {
    console.log("⏸️ Coleta pausada — mensagem ignorada");
    return;
  }



  // Extrair dados GoGo (formato: "nomeGoGo luz=846.00")
  const parts = topic.split("/");
  let boardName = parts[1] || "unknown";
  let sensorName = parts[2] || "unknown";

  let valueMatch = payload.match(/=([\d.]+)/);
  let value = valueMatch ? parseFloat(valueMatch[1]) : null;

  if (value !== null) {
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
  } else {
    console.warn("⚠️ Payload não reconhecido:", payload);
  }
});

// --- Atualização de status ---
function updateStatus(msg) {
  if (statusText) statusText.textContent = msg;
  console.log("[GoGoData] " + msg);
}

function setStatusIndicator(color) {
  const indicator = document.getElementById("statusIndicator");
  if (!indicator) {
    console.warn("Indicador de status não encontrado");
    return;
  }else{
    console.log("Atualizando indicador de status para:", color);
  }

  // reseta classes de cor
  indicator.classList.remove("bg-gray-400", "bg-green-500", "bg-red-500");

  if (color === "green") {
    indicator.classList.add("bg-green-500");
  } else if (color === "red") {
    indicator.classList.add("bg-red-500");
  } else {
    indicator.classList.add("bg-gray-400");
  }
}


// --- Log visual de dados ---
function logData(caseObj) {
  const logContainer = document.getElementById("dataLog");
  if (!logContainer) return;

  const entry = document.createElement("div");
  entry.textContent = `${caseObj.timestamp} | ${caseObj.board} | ${caseObj.sensor} = ${caseObj.value}`;
  logContainer.prepend(entry); // adiciona no topo

  if (logContainer.childNodes.length > 20) {
    logContainer.removeChild(logContainer.lastChild);
  }
}

// --- aguarda codapInterface ---
async function waitForCodap(timeout = 10000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (typeof codapInterface !== "undefined") {
      return true;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

// --- inicializa codapInterface e cria dataContext ---
async function initCodapIfAvailable() {
  const ok = await waitForCodap(10000, 200);
  if (!ok) {
    console.warn("codapInterface não detectado após timeout — plugin rodando em modo standalone.");
    updateStatus("CODAP não detectado — modo standalone.");
    codapReady = false;
    return;
  }

  try {
    await codapInterface.init({
      name: "GoGoData",
      title: "Dados GoGoBoard",
      version: "1.2",
      dimensions: { width: 420, height: 400 },
      preventDataContextReorg: false
    });

    // cria dataContext (caso não exista)
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
    updateStatus("GoGo Board conectada ao CODAP");
    flushCodapQueue();
  } catch (e) {
    console.error("Erro inicializando codapInterface ou criando dataContext:", e);
    updateStatus("Erro na inicialização do CODAP");
    codapReady = false;
  }
}

// --- enviar para CODAP com fallback em fila ---
function sendToCODAP(caseObj) {
  if (codapReady && typeof codapInterface !== "undefined") {
    codapInterface.sendRequest({
      action: "create",
      resource: "dataContext[GoGoBoardData].item",
      values: [caseObj]
    }, (res) => {
      console.log("Enviado ao CODAP:", caseObj, res);
    });
  } else {
    codapSendQueue.push(caseObj);
    console.warn("codapInterface não pronto — caso enfileirado", caseObj);
  }
}

function flushCodapQueue() {
  if (!codapReady || typeof codapInterface === "undefined") return;
  if (codapSendQueue.length === 0) return;
  console.log("Enviando fila de", codapSendQueue.length, "casos para o CODAP...");
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


// --- 26 de outubroBotões de controle de coleta ---
const startBtn = document.getElementById("startButton");
const stopBtn = document.getElementById("stopButton");

if (startBtn && stopBtn) {
  startBtn.addEventListener("click", () => {
    collecting = true;
    updateStatus("Coleta iniciada");
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


// ---Teste Fake Parte 2---

/*

// --- lógica fake (botão de teste) ---
fakeBtn.addEventListener("click", () => {
  updateStatus("Iniciando teste fake (5 leituras, 2s)...");

  let count = 0;
  const intervalId = setInterval(() => {
    count++;
    const fake = {
      timestamp: new Date().toISOString(),
      board: "fakeBoard",
      sensor: "fakeSensor",
      value: +(Math.random() * 100).toFixed(2)
    };

    sendToCODAP(fake);
    console.log("Fake gerado:", fake);
    logData(fake);

    if (count >= 5) {
      clearInterval(intervalId);
      updateStatus("Teste fake concluído");
    }
  }, 2000);
});

*/

// ----------------- inicialização -----------------
(async function boot() {
  updateStatus("Inicializando plugin...");
  await initCodapIfAvailable();
  console.log("Boot completo. codapReady=", codapReady);
  setStatusIndicator("gray");
})();

if (!codapReady) {
  const reconnectInterval = setInterval(async () => {
    if (typeof window.codapInterface !== "undefined") {
      console.log("codapInterface agora disponível — inicializando...");
      clearInterval(reconnectInterval);
      await initCodapIfAvailable();
      return;
    }
    console.log("Tentando detectar CODAP...");
  }, 5000);
}