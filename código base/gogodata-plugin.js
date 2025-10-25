// Acessa os elementos HTML da interface
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const startSendingButton = document.getElementById('startSendingButton');
const stopSendingButton = document.getElementById('stopSendingButton');
const statusText = document.getElementById('statusText');

let port; // Representa a porta serial (USB)
let reader; // Leitor de dados da porta serial
let isSending = false; // Flag para controlar o envio de dados

// Objeto que conterá os dados a serem enviados ao CODAP
let goGoDataCollection = {
    name: "Dados GoGoBoard",
    attrs: [
        { name: "Tempo", type: "numeric", unit: "segundos" },
        { name: "Sensor1", type: "numeric", unit: "valor" },
        { name: "Sensor2", type: "numeric", unit: "valor" },
        { name: "Sensor3", type: "numeric", unit: "valor" }
    ]
};

// 1. Inicializa o CODAP
codapInterface.init({
    name: 'GoGoData Plugin',
    title: 'GoGoData',
    dimensions: { width: 400, height: 250 },
    preventDataContextReorg: false
}).then(async (result) => {
    // 2. Cria o conjunto de dados (dataset) no CODAP
    await codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext',
        values: {
            name: goGoDataCollection.name,
            collections: [{
                name: 'sensores',
                attrs: goGoDataCollection.attrs
            }]
        }
    });

    statusText.textContent = 'Pronto para conectar!';
});

// 3. Gerencia a conexão com o GoGo Board
connectButton.addEventListener('click', async () => {
    try {
        // Usa a Web Serial API para pedir acesso à porta serial
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 }); // GoGo Board usa 9600 bps

        statusText.textContent = 'Conectado! Aguardando dados...';
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        startSendingButton.disabled = false;

        // Inicia a leitura dos dados
        reader = port.readable.getReader();
        while (port.readable && isSending) {
            try {
                const { value, done } = await reader.read();
                if (done) {
                    reader.releaseLock();
                    break;
                }
                const decoder = new TextDecoder('utf-8');
                const decodedValue = decoder.decode(value);
                
                // Processa a linha de dados
                processData(decodedValue);
            } catch (error) {
                console.error('Erro na leitura:', error);
            }
        }
    } catch (error) {
        console.error('Erro na conexão:', error);
        statusText.textContent = `Erro: ${error.message}`;
    }
});

disconnectButton.addEventListener('click', async () => {
    isSending = false;
    if (reader) {
        await reader.cancel();
    }
    await port.close();

    statusText.textContent = 'Desconectado';
    connectButton.disabled = false;
    disconnectButton.disabled = true;
    startSendingButton.disabled = true;
    stopSendingButton.disabled = true;
});

// 4. Inicia e para o envio de dados
startSendingButton.addEventListener('click', () => {
    isSending = true;
    startSendingButton.disabled = true;
    stopSendingButton.disabled = false;
    statusText.textContent = 'Enviando dados...';
});

stopSendingButton.addEventListener('click', () => {
    isSending = false;
    startSendingButton.disabled = false;
    stopSendingButton.disabled = true;
    statusText.textContent = 'Coleta parada';
});

// 5. Limpa e envia os dados para o CODAP
function processData(data) {
    if (!isSending) return;

    // Limpeza de dados: remove espaços e quebras de linha
    const cleanedData = data.trim();
    if (cleanedData === "") return;

    // Supõe que o GoGo Board envia dados separados por vírgula
    const values = cleanedData.split(',').map(Number);

    if (values.length === 3) { // Exemplo com 3 sensores
        const newCase = {
            values: {
                Tempo: Date.now(), // Tempo em milissegundos
                Sensor1: values[0],
                Sensor2: values[1],
                Sensor3: values[2]
            }
        };

        // Envia o caso (linha de dados) para o CODAP
        codapInterface.sendRequest({
            action: 'create',
            resource: 'dataContext[Dados GoGoBoard].item',
            values: newCase
        });
    }
}