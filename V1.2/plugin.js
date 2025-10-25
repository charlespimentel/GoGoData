// plugin.js (versão resistente ao timing do CODAP, com fila de envio)

const statusText = document.getElementById("statusText");
const connectBtn = document.getElementById("connectButton");
const disconnectBtn = document.getElementById("disconnectButton");
const startBtn = document.getElementById("startSendingButton");
const stopBtn = document.getElementById("stopSendingButton");
const fakeBtn = document.getElementById("sendFakeButton");

let mqttClient = null;
let isConnected = false;
let isForwarding = false;
let codapReady = false;

// fila para casos que chegam antes do codapInterface estar pronto
const codapSendQueue = [];

// Exemplo usando Mosquitto públicfakeBtno
const brokerUrl = "wss://38543d8f57c14b2f8ef0c5c4e3130977.s1.eu.hivemq.cloud:8884/mqtt";

const options = {
  username: "admin",   
  password: "Gogoboard!1",     
  clean: true,               
  connectTimeout: 4000,      
  reconnectPeriod: 1000      // tenta reconectar a cada 1s
};

const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("✅ Conectado ao HiveMQ Cloud!");
  // Inscreve no tópico desejado
  client.subscribe("gogo/sensores", (err) => {
    if (!err) {
      console.log("📡 Inscrito em gogo/sensores");
    } else {
      console.error("Erro ao se inscrever:", err);
    }
  });
});

client.on("error", (err) => {
  console.error("Erro na conexão MQTT:", err);
});

client.on("message", (topic, message) => {
  const payload = message.toString();
  console.log(`📥 Mensagem de ${topic}:`, payload);

  // Envia para o fluxo do plugin → CODAP
  processDataLine(payload);
});


// --- Atualização de status ---
function updateStatus(msg) {
  if (statusText) statusText.textContent = msg;
  console.log("[GoGoData] " + msg);
}

// --- aguarda codapInterface  ---
async function waitForCodap(timeout = 10000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (typeof codapInterface !== "undefined") {
      return true;
    }
    //checa window.parent.codapInterface em alguns setups, mas geralmente codapInterface é injetado no iframe.
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
    // inicializa
    await codapInterface.init({
      name: "GoGoData",
      title: "Dados GoGoBoard",
      version: "1.1",
      dimensions: { width: 400, height: 300 },
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
              { name: "sensor1", type: "numeric" },
              { name: "sensor2", type: "numeric" },
              { name: "sensor3", type: "numeric" }
            ]
          }
        ]
      }
    });

    codapReady = true;
    updateStatus("CODAP detectado e dataset pronto ✅");

    // envia qualquer caso pendente na fila
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
    // empilha para enviar depois
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
  updateStatus("Fila enviada ao CODAP ✅");
}

// --- parser de payload (CSV ou JSON) ---
function parsePayload(payload) {
  const text = String(payload).trim();
  if (!text) return null;

  // tenta JSON
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const obj = JSON.parse(text);
      const s1 = Number(obj.s1 ?? obj.sensor1 ?? obj[0] ?? NaN);
      const s2 = Number(obj.s2 ?? obj.sensor2 ?? obj[1] ?? NaN);
      const s3 = Number(obj.s3 ?? obj.sensor3 ?? obj[2] ?? NaN);
      if ([s1, s2, s3].some(v => isNaN(v))) return null;
      return { sensor1: s1, sensor2: s2, sensor3: s3 };
    } catch (e) {
      // segue para CSV fallback
    }
  }

  // CSV fallback
  const sep = text.includes(",") ? "," : (text.includes(";") ? ";" : null);
  if (!sep) return null;
  const parts = text.split(sep).map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const s1 = parseFloat(parts[0]);
  const s2 = parseFloat(parts[1]);
  const s3 = parseFloat(parts[2]);
  if ([s1, s2, s3].some(v => isNaN(v))) return null;
  return { sensor1: s1, sensor2: s2, sensor3: s3 };
}

// --- função que processa uma linha e encaminha ao CODAP (ou enfileira) ---
function processDataLine(line) {
  const parsed = parsePayload(line);
  if (!parsed) {
    console.warn("Linha não reconhecida (ignorando):", line);
    return;
  }
  const caseObj = {
    timestamp: new Date().toISOString(),
    sensor1: parsed.sensor1,
    sensor2: parsed.sensor2,
    sensor3: parsed.sensor3
  };

  // envia 
  sendToCODAP(caseObj);
  updateStatus("Processado: " + caseObj.timestamp);
}

// --- lógica fake (botão de teste) ---
fakeBtn.addEventListener("click", () => {
  updateStatus("Iniciando teste fake (5 leituras, 2s)...");

  let count = 0;
  const intervalId = setInterval(() => {
    count++;
    const fake = {
      timestamp: new Date().toISOString(),
      sensor1: +(Math.random() * 100).toFixed(2),
      sensor2: +(Math.random() * 100).toFixed(2),
      sensor3: +(Math.random() * 100).toFixed(2)
    };

    // usa sendToCODAP — ele enfileira se codap não estiver pronto
    sendToCODAP(fake);
    console.log("Fake gerado:", fake);

    if (count >= 5) {
      clearInterval(intervalId);
      updateStatus("Teste fake concluído");
    }
  }, 2000);
});

// ----------------- inicialização -----------------
(async function boot() {
  updateStatus("Inicializando plugin...");
  await initCodapIfAvailable();
  
  console.log("Boot completo. codapReady=", codapReady);
})();

// tenta reconectar periodicamente caso CODAP não esteja presente ainda
if (!codapReady) {
  const reconnectInterval = setInterval(async () => {
    if (typeof window.codapInterface !== "undefined") {
      console.log("codapInterface agora disponível — inicializando...");
      clearInterval(reconnectInterval);
      await initCodapIfAvailable();
      return;
    }
    
    console.log("Tentando detectar CODAP...");
    
  }, 5000); // tenta a cada 5s
}
