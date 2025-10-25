let port, reader;
let isConnected = false;
let isSending = false;
let sendInterval = null;

// Inicialização do CODAP
codapInterface.init({
  name: "GoGoData",
  title: "Dados GoGoBoard",
  version: "1.0",
  dimensions: { width: 400, height: 300 },
  dataContext: {
    name: "GoGoBoardData",
    title: "Leituras da GoGoBoard",
    collections: [
      {
        name: "leituras",
        labels: {
          singleCase: "leitura",
          pluralCase: "leituras"
        },
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

// Botões da interface
const statusText = document.getElementById("statusText");
const connectBtn = document.getElementById("connectButton");
const disconnectBtn = document.getElementById("disconnectButton");
const startBtn = document.getElementById("startSendingButton");
const stopBtn = document.getElementById("stopSendingButton");

const fakeBtn = document.getElementById("sendFakeButton");

// Atualiza status na tela
function updateStatus(msg) {
  statusText.textContent = msg;
}

//Envia os dados fake
fakeBtn.addEventListener("click", () => {
  updateStatus("Enviando dados fake para CODAP...");

  // simula envio de 5 leituras, 1 a cada 2s
  let count = 0;
  const fakeInterval = setInterval(() => {
    count++;
    const fakeCase = {
      timestamp: new Date().toISOString(),
      sensor1: Math.floor(Math.random() * 100),
      sensor2: Math.floor(Math.random() * 100),
      sensor3: Math.floor(Math.random() * 100)
    };

    codapInterface.sendRequest({
      action: "create",
      resource: "dataContext[GoGoBoardData].item",
      values: [fakeCase]
    });

    console.log("Fake enviado:", fakeCase);

    if (count >= 5) {
      clearInterval(fakeInterval);
      updateStatus("Teste fake concluído ✅");
    }
  }, 2000);
});

// Conectar GoGoBoard via USB
connectBtn.addEventListener("click", async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    updateStatus("Conectado à GoGoBoard ✅");
    isConnected = true;

    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    startBtn.disabled = false;

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();
  } catch (err) {
    console.error("Erro ao conectar:", err);
    updateStatus("Erro na conexão ❌");
  }
});

// Desconectar GoGoBoard
disconnectBtn.addEventListener("click", async () => {
  try {
    if (reader) {
      await reader.cancel();
      reader.releaseLock();
    }
    if (port) {
      await port.close();
    }
    updateStatus("Desconectado");
    isConnected = false;
    isSending = false;

    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    startBtn.disabled = true;
    stopBtn.disabled = true;
  } catch (err) {
    console.error("Erro ao desconectar:", err);
  }
});

// Começar a enviar dados (com intervalo de 2s)
startBtn.addEventListener("click", () => {
  if (!isConnected) return;
  isSending = true;
  updateStatus("Enviando dados a cada 2 segundos...");

  startBtn.disabled = true;
  stopBtn.disabled = false;

  sendInterval = setInterval(readAndSendData, 2000);
});

// Parar envio
stopBtn.addEventListener("click", () => {
  isSending = false;
  updateStatus("Envio pausado");

  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (sendInterval) clearInterval(sendInterval);
});

// Lê uma linha da GoGoBoard e envia ao CODAP
async function readAndSendData() {
  if (!reader || !isSending) return;

  try {
    const { value, done } = await reader.read();
    if (done) return;

    if (value) {
      processData(value.trim());
    }
  } catch (err) {
    console.error("Erro na leitura:", err);
  }
}

// Processa e envia ao CODAP
function processData(line) {
  const values = line.split(",");
  if (values.length < 3) return;

  const s1 = parseFloat(values[0]);
  const s2 = parseFloat(values[1]);
  const s3 = parseFloat(values[2]);

  if (isNaN(s1) || isNaN(s2) || isNaN(s3)) return;

  const newCase = {
    timestamp: new Date().toISOString(), // formato legível
    sensor1: s1,
    sensor2: s2,
    sensor3: s3
  };

  codapInterface.sendRequest({
    action: "create",
    resource: "dataContext[GoGoBoardData].item",
    values: [newCase]
  });
}