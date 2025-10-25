// plugin.js (versão resistente ao timing do CODAP, com fila de envio)

// --- UI elements (assume que index.html tem esses IDs) ---
const statusText = document.getElementById("statusText");
const connectBtn = document.getElementById("connectButton");
const disconnectBtn = document.getElementById("disconnectButton");
const startBtn = document.getElementById("startSendingButton");
const stopBtn = document.getElementById("stopSendingButton");
const fakeBtn = document.getElementById("sendFakeButton");

// --- Estado interno ---
let mqttClient = null;
let isConnected = false;
let isForwarding = false;
let codapReady = false;

// fila para casos que chegam antes do codapInterface estar pronto
const codapSendQueue = [];

// --- utils de UI / logs ---
function updateStatus(msg) {
  if (statusText) statusText.textContent = msg;
  console.log("[GoGoData] " + msg);
}

// --- aguarda codapInterface aparecer (timeout ms) ---
async function waitForCodap(timeout = 10000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (typeof codapInterface !== "undefined") {
      return true;
    }
    // também pode checar window.parent.codapInterface em alguns setups, mas geralmente codapInterface é injetado no iframe.
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

// --- inicializa codapInterface de forma segura e cria dataContext ---
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
      // opcional: log de confirmação
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

  // envia (com fila se necessário)
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
  // se o codap não aparecer imediatamente, initCodapIfAvailable já colocou codapReady=false e deixou a fila disponível.
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
    // se desejar, fazemos uma tentativa "leve" antes de tirar proveito do initCodapIfAvailable
    console.log("Tentando detectar CODAP...");
    // alternativamente, chamar initCodapIfAvailable() aqui também é possível
  }, 5000); // tenta a cada 5s
}
